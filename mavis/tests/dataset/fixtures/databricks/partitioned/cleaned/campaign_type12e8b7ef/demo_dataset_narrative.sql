WITH
cohort_stream AS (
	SELECT
		*
	FROM test_schema.activity_stream_opened_email AS s
	WHERE DATE(s.ts) > DATE('2021-09-01')
),
in_between_stream AS (
	SELECT
		*
	FROM test_schema.activity_stream_completed_order AS s
	WHERE DATE(s.ts) > DATE('2021-09-01')
),
cohort AS (
	SELECT
		*
	FROM (
		SELECT
			s.ts AS timestamp
			, s.feature_json:a1 AS campaign_type
			, s.customer AS join_customer
			, s.ts AS join_ts
			, s.activity_id AS join_cohort_id
			, LEAD(s.ts) over (PARTITION by s.customer ORDER BY s.ts) AS join_cohort_next_ts
		FROM cohort_stream AS s
	) AS c
	WHERE (
		DATE(c.timestamp) < DATE('2022-04-13')  AND
		DATE(c.timestamp) > DATE('2021-09-01')
	)
),
append_in_between AS (
	SELECT
		join_customer
		, join_cohort_id
		, MIN(first_in_between_completed_order_timestamp) AS first_in_between_completed_order_timestamp
	FROM (
		SELECT
			s.customer AS join_customer
			, c.join_cohort_id
			, s.ts
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
),
raw_dataset AS (
	SELECT
		c.timestamp
		, c.campaign_type
		, in_between.first_in_between_completed_order_timestamp
		, CASE WHEN first_in_between_completed_order_timestamp is not NULL THEN 1 ELSE 0 END AS did_completed_order_between
	FROM cohort AS c
	LEFT JOIN append_in_between AS in_between
		ON (
			c.join_customer = in_between.join_customer  AND
			c.join_cohort_id = in_between.join_cohort_id
		)
)
SELECT
	*
FROM (
	SELECT
		*
		, CASE WHEN ( percent_of_total_opened_email < 0.005 AND cumulative_percent_of_total_opened_email >= 0.9 ) THEN 1 ELSE 0 END AS is_long_tail
	FROM (
		SELECT
			*
			, SUM(percent_of_total_opened_email) over (ORDER BY campaign_type DESC ROWS UNBOUNDED PRECEDING) AS cumulative_percent_of_total_opened_email
		FROM (
			SELECT
				*
				, total_opened_email / NULLIF(SUM(total_opened_email) OVER () , 0) AS percent_of_total_opened_email
			FROM (
				SELECT
					rd.campaign_type AS campaign_type
					, COUNT(1) AS total_opened_email
					, AVG(1.0000*rd.did_completed_order_between) AS conversion_rate_to_completed_order_between
					, STDDEV(rd.did_completed_order_between) AS stddev_did_completed_order_between
				FROM raw_dataset AS rd
				GROUP BY rd.campaign_type
			)
		)
	)
)
WHERE is_long_tail <> 1.0
ORDER BY total_opened_email DESC
