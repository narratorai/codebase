WITH
cohort_stream AS (
	SELECT
		*
	FROM test_schema.activity_stream_opened_email AS s
),
in_between_stream AS (
	SELECT
		*
	FROM test_schema.activity_stream_completed_order AS s
),
cohort AS (
	SELECT
		s.ts AS "timestamp"
		, s.customer AS "join_customer"
		, s.ts AS "join_ts"
		, s.activity_id AS "join_cohort_id"
		, LEAD(s.ts) over (PARTITION by s.customer ORDER BY s.ts) AS "join_cohort_next_ts"
	FROM cohort_stream AS s
),
append_in_between AS (
	SELECT
		join_customer
		, join_cohort_id
		, MIN(first_in_between_completed_order_timestamp) AS "first_in_between_completed_order_timestamp"
	FROM (
		SELECT
			s.customer AS "join_customer"
			, c.join_cohort_id
			, s.ts
			, CASE WHEN s.activity = 'completed_order' THEN s.ts END AS "first_in_between_completed_order_timestamp"
		FROM cohort AS c
		INNER JOIN in_between_stream AS s
			ON (
				s.customer = c.join_customer  AND
				s.ts > c.join_ts  AND
				s.ts <= COALESCE(c.join_cohort_next_ts, CAST('2100-01-01' AS DATE))
			)
	) AS s
	GROUP BY join_customer, join_cohort_id
),
raw_dataset AS (
	SELECT
		c.timestamp
		, in_between.first_in_between_completed_order_timestamp
		, CASE WHEN first_in_between_completed_order_timestamp is not NULL THEN 1 ELSE 0 END AS "did_completed_order_between"
		, DATEADD(month, datediff(month, 0, timestamp), 0) AS "month_1"
	FROM cohort AS c
	LEFT JOIN append_in_between AS in_between
		ON (
			c.join_customer = in_between.join_customer  AND
			c.join_cohort_id = in_between.join_cohort_id
		)
)
SELECT
	rd.month_1 AS "month"
	, COUNT(1) AS "total_opened_email"
	, AVG(1.000 * rd.did_completed_order_between) AS "conversion_rate_to_completed_order_between"
	, MIN(rd.a_90th_pct_conversion_rate_to_completed_order_between) AS "a_90th_pct_conversion_rate_to_completed_order_between"
	, MIN(rd.a_10th_pct_did_completed_order_between) AS "a_10th_pct_did_completed_order_between"
FROM (
	SELECT
		rd.*
		, PERCENTILE_CONT(0.9) within group (ORDER BY rd.did_completed_order_between) over (partition by rd.month_1) AS "a_90th_pct_conversion_rate_to_completed_order_between"
		, PERCENTILE_CONT(0.1) within group (ORDER BY rd.did_completed_order_between) over (partition by rd.month_1) AS "a_10th_pct_did_completed_order_between"
	FROM raw_dataset AS rd
) AS rd
GROUP BY rd.month_1
ORDER BY month ASC
