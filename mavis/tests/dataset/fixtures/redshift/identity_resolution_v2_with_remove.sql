UPDATE test_schema.activity_stream
SET
	customer = a.customer ,
	activity_occurrence = NULL
FROM (
	SELECT
		anonymous_customer_id
		, customer
		, CASE WHEN LAG(ts) over (PARTITION by anonymous_customer_id ORDER BY ts) is NULL THEN CAST('1970-01-01' AS DATE) ELSE DATE_ADD('minute', -30, ts) END AS "last_ts"
		, NVL(LEAD(DATE_ADD('minute', -30, ts)) over (PARTITION by anonymous_customer_id ORDER BY ts), CAST('2200-01-01' AS DATE)) AS "next_ts"
	FROM (
		SELECT
			activity_id
			, anonymous_customer_id
			, customer
			, ts
			, _activity_source
		FROM (
			SELECT
				*
				, LEAD(customer) over (PARTITION by anonymous_customer_id ORDER BY ts) AS "next_customer"
			FROM test_schema.identity__activity_stream
		)
		WHERE (
			next_customer is NULL OR
			customer <> next_customer
		)
	)
) AS a
WHERE
	(
		a.last_ts <> a.next_ts  AND
		activity_stream.anonymous_customer_id = a.anonymous_customer_id  AND
		NVL(activity_stream.customer, '') <> a.customer  AND
		activity_stream.ts > a.last_ts  AND
		activity_stream.ts <= a.next_ts  AND
		activity_stream._activity_source <> 'remove_activity'
	)
