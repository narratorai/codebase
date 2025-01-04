WITH
cohort_stream AS (
	SELECT
		*
	FROM test_schema.activity_stream_opened_email AS s
	WHERE CAST(s.ts AS DATE) > CAST('2021-09-01' AS DATE)
),
in_between_stream AS (
	SELECT
		*
	FROM test_schema.activity_stream_completed_order AS s
	WHERE CAST(s.ts AS DATE) > CAST('2021-09-01' AS DATE)
),
cohort AS (
	SELECT
		*
	FROM (
		SELECT
			s.ts AS timestamp
			, CAST(s.feature_json['a1'] AS VARCHAR(4096)) AS campaign_type
			, s.customer AS join_customer
			, s.ts AS join_ts
			, s.activity_id AS join_cohort_id
			, LEAD(s.ts) over (PARTITION by s.customer ORDER BY s.ts) AS join_cohort_next_ts
		FROM cohort_stream AS s
	) AS c
	WHERE (
		CAST(c.timestamp AS DATE) < CAST('2022-04-13' AS DATE)  AND
		CAST(c.timestamp AS DATE) > CAST('2021-09-01' AS DATE)
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
				s.ts <= COALESCE(c.join_cohort_next_ts, CAST('2100-01-01' AS DATE))
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
		, CASE WHEN campaign_type = 'MISSING YOU' THEN 'MISSING YOU' ELSE 'Not MISSING YOU' END AS grouped_campaign_type
	FROM cohort AS c
	LEFT JOIN append_in_between AS in_between
		ON (
			c.join_customer = in_between.join_customer  AND
			c.join_cohort_id = in_between.join_cohort_id
		)
)
SELECT
	*
	, RATIO_TO_REPORT(total_opened_email) OVER () AS percent_of_total_opened_email
FROM (
	SELECT
		rd.grouped_campaign_type AS grouped_campaign_type
		, COUNT(1) AS total_opened_email
		, AVG(1.0000*rd.did_completed_order_between) AS conversion_rate_to_completed_order_between
		, SUM(rd.did_completed_order_between) AS total_did_completed_order_between
	FROM raw_dataset AS rd
	GROUP BY rd.grouped_campaign_type
)
ORDER BY total_opened_email DESC
