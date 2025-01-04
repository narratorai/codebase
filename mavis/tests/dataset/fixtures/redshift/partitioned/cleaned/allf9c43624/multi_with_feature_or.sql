WITH
cohort_stream AS (
	SELECT
		*
	FROM test_schema.company_stream_updated_subscription AS s
),
cohort AS (
	SELECT
		*
	FROM (
		SELECT
			*
		FROM (
			SELECT
				s.ts AS "timestamp"
				, CAST(s.feature_json."a1" AS VARCHAR(4096)) AS "last_update_kind"
				, s.revenue_impact AS "current_subscription_value"
				, s.customer AS "join_customer"
				, s.ts AS "join_ts"
				, LEAD(s.ts) over (PARTITION by s.customer ORDER BY s.ts) AS "join_cohort_next_ts"
				, s.activity_id AS "join_cohort_id"
			FROM cohort_stream AS s
		) AS s
		WHERE s.join_cohort_next_ts is NULL
	) AS c
	WHERE c.last_update_kind <> 'churn'
),
raw_dataset AS (
	SELECT
		c."timestamp"
		, c.last_update_kind
		, c.current_subscription_value
	FROM cohort AS c
)
SELECT
	COUNT(1) AS "total_customers"
	, SUM(rd.current_subscription_value) AS "mrr"
FROM raw_dataset AS rd
ORDER BY total_customers DESC
