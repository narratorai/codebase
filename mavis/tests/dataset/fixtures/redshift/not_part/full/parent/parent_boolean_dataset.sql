WITH
cohort_stream AS (
	SELECT
		*
	FROM test_schema.activity_stream AS s
	WHERE s.activity = 'purchased_premium'
),
after_stream AS (
	SELECT
		*
	FROM test_schema.activity_stream AS s
	WHERE s.activity = 'purchased_premium'
),
cohort AS (
	SELECT
		s.activity_id
		, s.ts AS "timestamp"
		, s.customer
		, NVL(s.customer, s.anonymous_customer_id) AS "unique_identifier"
		, CAST(s.feature_json."a1" AS VARCHAR(4096)) AS "product_identifier"
		, CAST(s.feature_json."a2" AS VARCHAR(4096)) AS "is_trial_conversion"
		, CAST(s.feature_json."a3" AS VARCHAR(4096)) AS "renewal_number"
		, s.revenue_impact
		, ROW_NUMBER() over (PARTITION by NVL(s.customer, s.anonymous_customer_id) ORDER BY s.ts) AS "activity_occurrence"
		, NVL(s.customer, s.anonymous_customer_id) AS "join_customer"
		, s.ts AS "join_ts"
		, s.activity_id AS "join_cohort_id"
	FROM cohort_stream AS s
	ORDER BY "timestamp" DESC
),
append_after AS (
	SELECT
		NVL(s.customer, s.anonymous_customer_id) AS "join_customer"
		, c.join_cohort_id
		, MIN(CASE WHEN ( s.activity = 'purchased_premium' AND ( enriched_purchase_tbl.is_change_during_sub_period = False OR enriched_purchase_tbl.is_change_during_sub_period is NULL ) ) THEN s.ts END) AS "first_after_purchased_premium_timestamp"
	FROM cohort AS c
	INNER JOIN after_stream AS s
		ON (
			NVL(s.customer, s.anonymous_customer_id) = c.join_customer  AND
			s.ts > c.join_ts
		)
	LEFT JOIN test_schema.enriched_purchase AS enriched_purchase_tbl
		ON s.activity_id = enriched_purchase_tbl.enriched_activity_id
	GROUP BY NVL(s.customer, s.anonymous_customer_id), c.join_cohort_id
)
SELECT
	c.activity_id
	, c."timestamp"
	, c.customer
	, c.unique_identifier
	, c.product_identifier
	, c.is_trial_conversion
	, c.renewal_number
	, c.revenue_impact
	, c.activity_occurrence
	, after.first_after_purchased_premium_timestamp
	, CASE WHEN first_after_purchased_premium_timestamp is not NULL THEN 1 ELSE 0 END AS "did_purchased_premium_after"
	, FLOOR(DATE_DIFF('second', join_ts, first_after_purchased_premium_timestamp)/86400) AS "days_to_purchased_premium"
FROM cohort AS c
LEFT JOIN append_after AS after
	ON (
		c.join_customer = after.join_customer  AND
		c.join_cohort_id = after.join_cohort_id
	)
ORDER BY "timestamp" DESC
