WITH
cohort_stream AS (
	SELECT
		*
	FROM test_schema.activity_stream_opened_email AS s
),
in_between_stream AS (
	SELECT
		*
	FROM test_schema.activity_stream_started_session AS s
	UNION ALL
		SELECT
		*
	FROM test_schema.activity_stream_completed_order AS s
),
cohort AS (
	SELECT
		s.activity_id
		, s.ts AS timestamp
		, s.customer
		, s.feature_json:a1 AS campaign_type
		, ROW_NUMBER() over (PARTITION by s.customer ORDER BY s.ts) AS activity_occurrence
		, s.customer AS join_customer
		, s.ts AS join_ts
		, s.activity_id AS join_cohort_id
		, LEAD(s.ts) over (PARTITION by s.customer ORDER BY s.ts) AS join_cohort_next_ts
	FROM cohort_stream AS s
	ORDER BY timestamp DESC
),
append_in_between AS (
	SELECT
		join_customer
		, join_cohort_id
		, MIN(first_in_between_started_session_timestamp) AS first_in_between_started_session_timestamp
		, MIN(first_in_between_completed_order_timestamp) AS first_in_between_completed_order_timestamp
	FROM (
		SELECT
			s.customer AS join_customer
			, c.join_cohort_id
			, s.ts
			, CASE WHEN s.activity = 'started_session' THEN s.ts END AS first_in_between_started_session_timestamp
			, CASE WHEN s.activity = 'completed_order' THEN s.ts END AS first_in_between_completed_order_timestamp
		FROM cohort AS c
		INNER JOIN in_between_stream AS s
			ON (
				s.customer = c.join_customer  AND
				s.ts > c.join_ts  AND
				s.ts <= NVL(c.join_cohort_next_ts, DATE('2100-01-01'))
			)
	) AS s
	GROUP BY join_customer, join_cohort_id
)
SELECT
	c.activity_id
	, c.timestamp
	, c.customer
	, c.campaign_type
	, c.activity_occurrence
	, in_between.first_in_between_started_session_timestamp
	, in_between.first_in_between_completed_order_timestamp
	, CASE WHEN first_in_between_started_session_timestamp is not NULL THEN 1 ELSE 0 END AS did_started_session_between
	, FLOOR(datediff(second, join_ts, first_in_between_started_session_timestamp)/86400) AS days_to_started_session
	, CASE WHEN first_in_between_completed_order_timestamp is not NULL THEN 1 ELSE 0 END AS did_completed_order_between
	, FLOOR(datediff(second, join_ts, first_in_between_completed_order_timestamp)/86400) AS days_to_completed_order
	, DATE_TRUNC('month', timestamp) AS month_of_timestamp
FROM cohort AS c
LEFT JOIN append_in_between AS in_between
	ON (
		c.join_customer = in_between.join_customer  AND
		c.join_cohort_id = in_between.join_cohort_id
	)
ORDER BY timestamp DESC
