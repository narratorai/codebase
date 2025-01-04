SELECT
	COUNT(1) AS total_rows
FROM (
	SELECT
		*
	FROM test_schema.identity__activity_stream
	WHERE _activity_source = "undo_slug"
) AS n
LEFT JOIN (
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
			WHERE not (
				_activity_source = "undo_slug"
			)
		)
		WHERE (
			next_customer is NULL OR
			customer <> next_customer
		)
	)
) AS o
	ON (
		n.anonymous_customer_id = o.anonymous_customer_id  AND
		n.customer = o.customer  AND
		n.ts > o.last_ts  AND
		n.ts < o.next_ts
	)
WHERE o.anonymous_customer_id is NULL
