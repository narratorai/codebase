WITH
cohort_stream AS (
	SELECT
		*
	FROM test_schema.activity_stream AS s
	WHERE (
		s.activity = 'opened_email'  AND
		DATE(s.ts) > DATE('2021-09-01')
	)
),
in_between_stream AS (
	SELECT
		*
	FROM test_schema.activity_stream AS s
	WHERE (
		s.activity = 'completed_order'  AND
		DATE(s.ts) > DATE('2021-09-01')
	)
),
cohort AS (
	SELECT
		*
	FROM (
		SELECT
			s.ts AS timestamp
			, s.customer AS join_customer
			, s.ts AS join_ts
			, s.activity_id AS join_cohort_id
			, LEAD(s.ts) over (PARTITION by s.customer ORDER BY s.ts) AS join_cohort_next_ts
		FROM cohort_stream AS s
	) AS c
	WHERE DATE(c.timestamp) > DATE('2021-09-01')
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
		*
		, FLOOR(did_completed_order_between/0.01) * 0.01 AS rounded_did_completed_order_between
	FROM (
		SELECT
			c.timestamp
			, in_between.first_in_between_completed_order_timestamp
			, CASE WHEN first_in_between_completed_order_timestamp is not NULL THEN 1 ELSE 0 END AS did_completed_order_between
		FROM cohort AS c
		LEFT JOIN append_in_between AS in_between
			ON (
				c.join_customer = in_between.join_customer  AND
				c.join_cohort_id = in_between.join_cohort_id
			)
	)
)
SELECT
	*
FROM (
	SELECT
		*
		, total_opened_email / NULLIF(SUM(total_opened_email) OVER () , 0) AS percent_of_total_opened_email
	FROM (
		SELECT
			rd.rounded_did_completed_order_between AS rounded_did_completed_order_between
			, COUNT(1) AS total_opened_email
		FROM raw_dataset AS rd
		GROUP BY rd.rounded_did_completed_order_between
	)
)
WHERE rounded_did_completed_order_between <= 1.2
ORDER BY rounded_did_completed_order_between ASC
