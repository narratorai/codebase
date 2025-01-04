DELETE FROM test_schema.identity__activity_stream
WHERE
	activity_id in (SELECT
	activity_id
FROM (
	SELECT
		activity_id
		, ts
		, customer
		, LAG(ts) over (PARTITION by anonymous_customer_id ORDER BY ts) AS "last_ts"
		, LEAD(customer) over (PARTITION by anonymous_customer_id ORDER BY ts) AS "next_customer"
	FROM test_schema.identity__activity_stream
) AS sub_query
WHERE (
	last_ts is not NULL AND
	customer = next_customer  AND
	floor(EXTRACT(EPOCH FROM (ts - last_ts)) / 60) < 30
))
