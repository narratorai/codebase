MERGE INTO test_schema.activity_stream_started_session AS u
USING (
	SELECT
		anonymous_customer_id
		, customer
		, CASE WHEN LAG(ts) over (PARTITION by anonymous_customer_id ORDER BY ts) is NULL THEN DATE('1970-01-01') ELSE dateadd(minute, -30, ts) END AS last_ts
		, NVL(LEAD(dateadd(minute, -30, ts)) over (PARTITION by anonymous_customer_id ORDER BY ts), DATE('2200-01-01')) AS next_ts
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
				, LEAD(customer) over (PARTITION by anonymous_customer_id ORDER BY ts) AS next_customer
			FROM test_schema.identity__activity_stream
		)
		WHERE (
			next_customer is NULL OR
			customer <> next_customer
		)
	)
) AS a
ON 	(
		a.last_ts <> a.next_ts  AND
		u.anonymous_customer_id = a.anonymous_customer_id  AND
		NVL(u.customer, '') <> a.customer  AND
		u.ts > a.last_ts  AND
		u.ts <= a.next_ts
	)
WHEN MATCHED THEN UPDATE SET
	u.customer = a.customer ,
	u.activity_occurrence = NULL
