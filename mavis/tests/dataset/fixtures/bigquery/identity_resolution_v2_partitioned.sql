UPDATE test_schema.activity_stream_started_session
SET
	customer = a.customer ,
	activity_occurrence = NULL
FROM (
	SELECT
		anonymous_customer_id
		, customer
		, CASE WHEN LAG(ts) over (PARTITION by anonymous_customer_id ORDER BY ts) is NULL THEN SAFE_CAST( "1970-01-01" AS TIMESTAMP) ELSE TIMESTAMP_ADD(ts, INTERVAL -30 minute) END AS last_ts
		, COALESCE(LEAD(TIMESTAMP_ADD(ts, INTERVAL -30 minute)) over (PARTITION by anonymous_customer_id ORDER BY ts), SAFE_CAST( "2200-01-01" AS TIMESTAMP)) AS next_ts
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
WHERE
	(
		a.last_ts <> a.next_ts  AND
		activity_stream_started_session.anonymous_customer_id = a.anonymous_customer_id  AND
		COALESCE(activity_stream_started_session.customer, "") <> a.customer  AND
		activity_stream_started_session.ts > a.last_ts  AND
		activity_stream_started_session.ts <= a.next_ts
	)
