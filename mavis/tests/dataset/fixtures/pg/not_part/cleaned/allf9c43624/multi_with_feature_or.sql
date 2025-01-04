SELECT
	COUNT(1) AS "total_customers"
	, SUM(rd.current_subscription_value) AS "mrr"
FROM (
 	SELECT
		c.timestamp
		, c.last_update_kind
		, c.current_subscription_value
	FROM (
 		SELECT
			*
		FROM (
			SELECT
				*
			FROM (
				SELECT
					s.ts AS "timestamp"
					, s.feature_json ->> 'a1' AS "last_update_kind"
					, s.revenue_impact AS "current_subscription_value"
					, s.customer AS "join_customer"
					, s.ts AS "join_ts"
					, LEAD(s.ts) over (PARTITION by s.customer ORDER BY s.ts) AS "join_cohort_next_ts"
					, s.activity_id AS "join_cohort_id"
				FROM (
 					SELECT
						*
					FROM test_schema.company_stream AS s
					WHERE s.activity = 'updated_subscription'
) AS s
			) AS s
			WHERE s.join_cohort_next_ts is NULL
		) AS c
		WHERE c.last_update_kind <> 'churn'
) AS c
) AS rd
ORDER BY total_customers DESC
