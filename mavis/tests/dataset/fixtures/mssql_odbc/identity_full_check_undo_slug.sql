SELECT
	COUNT(1) AS "total_rows"
FROM (
	SELECT
		*
	FROM test_schema.identity__activity_stream
	WHERE _activity_source = 'undo_slug'
) AS n
LEFT JOIN (
	SELECT
		anonymous_customer_id
		, customer
		, CASE WHEN LAG(ts) over (PARTITION by anonymous_customer_id ORDER BY ts) is NULL THEN CAST('1970-01-01' AS DATE) ELSE DATEADD(minute, -30, ts) END AS "last_ts"
		, COALESCE(LEAD(DATEADD(minute, -30, ts)) over (PARTITION by anonymous_customer_id ORDER BY ts), CAST('2200-01-01' AS DATE)) AS "next_ts"
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
			WHERE not (
				_activity_source = 'undo_slug'
			)
		) AS sub_query
		WHERE (
			next_customer is NULL OR
			customer <> next_customer
		)
	) AS sub_query
) AS o
	ON (
		n.anonymous_customer_id = o.anonymous_customer_id  AND
		n.customer = o.customer  AND
		n.ts > o.last_ts  AND
		n.ts < o.next_ts
	)
WHERE o.anonymous_customer_id is NULL
