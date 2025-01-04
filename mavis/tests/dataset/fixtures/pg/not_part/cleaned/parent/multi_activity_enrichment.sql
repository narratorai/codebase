SELECT
	*
	, CASE WHEN ( did_redeem_trial = 1 AND days_to_first_redeem_trial < 8 ) THEN '1' ELSE '0' END AS "did_redeem_trial_within_first_week"
	, CASE WHEN ( did_redeem_trial = 1 AND days_to_first_redeem_trial >= 8 ) THEN '1' ELSE '0' END AS "did_redeem_trial_after_first_week"
	, CASE WHEN ( did_purchased_premium = 1 AND days_to_first_purchased_premium <= 48 ) THEN '1' ELSE '0' END AS "did_purchase_premium_within_48_hrs"
	, CASE
 				WHEN did_purchased_premium = 0  THEN  NULL
 				WHEN days_to_first_purchased_premium < 1  THEN  'Day 00'
 				WHEN days_to_first_purchased_premium < 2  THEN  'Day 01'
 				WHEN days_to_first_purchased_premium < 3  THEN  'Day 02'
 				WHEN days_to_first_purchased_premium < 4  THEN  'Day 03'
 				WHEN days_to_first_purchased_premium < 5  THEN  'Day 04'
 				WHEN days_to_first_purchased_premium < 6  THEN  'Day 05'
 				WHEN days_to_first_purchased_premium < 7  THEN  'Day 06'
 				WHEN days_to_first_purchased_premium < 8  THEN  'Day 07'
 				WHEN days_to_first_purchased_premium < 15  THEN  'Day 08 - 14'
 				WHEN days_to_first_purchased_premium < 22  THEN  'Day 15 - 21'
 				WHEN days_to_first_purchased_premium < 29  THEN  'Day 22 - 28'
 				ELSE  'Day 29+'
 			END AS "day_of_first_premium_purchase"
FROM (
	SELECT
		c.first_activity_id
		, c.registration_timestamp
		, c.customer
		, c.activity_occurrence
		, c.age_at_reg_bucket
		, c.source
		, after.first_trial_timestamp
		, after.first_premium_purchase_timestamp
		, after.first_purchase_is_trial_conversion
		, after.first_ppp_bought_timestamp
		, after.first_ppp_feature
		, after.first_ppp_location
		, after.total_purchases
		, after.a_3_mo_ltv
		, after.first_boost_purchase_timestamp
		, after.first_subscription_tier
		, after.first_store
		, after.first_country
		, CASE WHEN first_trial_timestamp is not NULL THEN 1 ELSE 0 END AS "did_redeem_trial"
		, floor(EXTRACT(EPOCH FROM (first_trial_timestamp - join_ts)) / 86400) AS "days_to_first_redeem_trial"
		, CASE WHEN first_premium_purchase_timestamp is not NULL THEN 1 ELSE 0 END AS "did_purchased_premium"
		, floor(EXTRACT(EPOCH FROM (first_premium_purchase_timestamp - join_ts)) / 86400) AS "days_to_first_purchased_premium"
		, CASE WHEN first_ppp_bought_timestamp is not NULL THEN 1 ELSE 0 END AS "did_trigger_bought_ppp"
		, floor(EXTRACT(EPOCH FROM (first_ppp_bought_timestamp - join_ts)) / 86400) AS "days_to_first_bought_ppp"
		, CASE WHEN first_boost_purchase_timestamp is not NULL THEN 1 ELSE 0 END AS "did_purchase_boost"
		, floor(EXTRACT(EPOCH FROM (first_boost_purchase_timestamp - join_ts)) / 86400) AS "days_to_first_boost_purchase"
		, DATE_TRUNC('month', registration_timestamp) AS "month_of_registration_timestamp"
	FROM (
 		SELECT
			*
		FROM (
			SELECT
				s.activity_id AS "first_activity_id"
				, s.ts AS "registration_timestamp"
				, s.customer
				, ROW_NUMBER() over (PARTITION by s.customer ORDER BY s.ts) AS "activity_occurrence"
				, customer_tbl.age_at_reg_bucket
				, customer_tbl.source
				, s.customer AS "join_customer"
				, s.ts AS "join_ts"
				, ROW_NUMBER() over (PARTITION by s.customer ORDER BY s.ts) AS "join_activity_occurrence"
				, s.activity_id AS "join_cohort_id"
			FROM (
 				SELECT
					*
				FROM test_schema.activity_stream AS s
				WHERE s.activity = 'created_account'
) AS s
			LEFT JOIN test_schema.customer AS customer_tbl
				ON s.customer = customer_tbl.customer
		) AS s
		WHERE s.join_activity_occurrence = 1
		ORDER BY registration_timestamp DESC
) AS c
	LEFT JOIN (
 		SELECT
			s.*
			, enriched_purchase_1_tbl.subscription_tier AS "first_subscription_tier"
			, enriched_purchase_1_tbl.store AS "first_store"
			, enriched_purchase_1_tbl.country AS "first_country"
		FROM (
			SELECT
				s.customer AS "join_customer"
				, c.join_cohort_id
				, MIN(CASE WHEN s.activity = 'started_trial' THEN s.ts END) AS "first_trial_timestamp"
				, MIN(CASE WHEN s.activity = 'purchased_premium' THEN s.ts END) AS "first_premium_purchase_timestamp"
				, NULLIF(SUBSTRING(MIN(CASE WHEN s.activity = 'purchased_premium' THEN CONCAT(DATE_TRUNC('second', s.ts), COALESCE(s.feature_json ->> 'a2','')) END) ,20, 1000),'') AS "first_purchase_is_trial_conversion"
				, NULLIF(SUBSTRING(MIN(CASE WHEN s.activity = 'purchased_premium' THEN CONCAT(DATE_TRUNC('second', s.ts), COALESCE(s.activity_id,'')) END) ,20, 1000),'') AS "join_enriched_activity_id_1_a"
				, MIN(CASE WHEN s.activity = 'bought_ppp' THEN s.ts END) AS "first_ppp_bought_timestamp"
				, NULLIF(SUBSTRING(MIN(CASE WHEN s.activity = 'bought_ppp' THEN CONCAT(DATE_TRUNC('second', s.ts), COALESCE(s.feature_json ->> 'a1','')) END) ,20, 1000),'') AS "first_ppp_feature"
				, NULLIF(SUBSTRING(MIN(CASE WHEN s.activity = 'bought_ppp' THEN CONCAT(DATE_TRUNC('second', s.ts), COALESCE(s.feature_json ->> 'a2','')) END) ,20, 1000),'') AS "first_ppp_location"
				, COUNT(CASE WHEN ( s.activity in ('purchased_premium', 'made_purchase') AND ABS(floor(EXTRACT(EPOCH FROM (s.ts - c.join_ts)) / 86400)) < 100 AND ( enriched_purchase_tbl.is_change_during_sub_period <> True OR enriched_purchase_tbl.is_change_during_sub_period is NULL ) ) THEN s.ts END) AS "total_purchases"
				, SUM(CASE WHEN ( s.activity in ('purchased_premium', 'made_purchase') AND ABS(floor(EXTRACT(EPOCH FROM (s.ts - c.join_ts)) / 86400)) < 100 AND ( enriched_purchase_tbl.is_change_during_sub_period <> True OR enriched_purchase_tbl.is_change_during_sub_period is NULL ) ) THEN s.revenue_impact END) AS "a_3_mo_ltv"
				, MIN(CASE WHEN ( s.activity = 'made_purchase' AND enriched_purchase_tbl.subscription_tier = 'Boost' ) THEN s.ts END) AS "first_boost_purchase_timestamp"
			FROM (
 				SELECT
					*
				FROM (
					SELECT
						s.activity_id AS "first_activity_id"
						, s.ts AS "registration_timestamp"
						, s.customer
						, ROW_NUMBER() over (PARTITION by s.customer ORDER BY s.ts) AS "activity_occurrence"
						, customer_tbl.age_at_reg_bucket
						, customer_tbl.source
						, s.customer AS "join_customer"
						, s.ts AS "join_ts"
						, ROW_NUMBER() over (PARTITION by s.customer ORDER BY s.ts) AS "join_activity_occurrence"
						, s.activity_id AS "join_cohort_id"
					FROM (
 						SELECT
							*
						FROM test_schema.activity_stream AS s
						WHERE s.activity = 'created_account'
) AS s
					LEFT JOIN test_schema.customer AS customer_tbl
						ON s.customer = customer_tbl.customer
				) AS s
				WHERE s.join_activity_occurrence = 1
				ORDER BY registration_timestamp DESC
) AS c
			INNER JOIN (
 				SELECT
					*
				FROM test_schema.activity_stream AS s
				WHERE s.activity in ('bought_ppp', 'made_purchase', 'purchased_premium', 'started_trial')
) AS s
				ON (
					s.customer = c.join_customer  AND
					s.ts > c.join_ts
				)
			LEFT JOIN test_schema.enriched_purchase AS enriched_purchase_tbl
				ON s.activity_id = enriched_purchase_tbl.enriched_activity_id
			GROUP BY s.customer, c.join_cohort_id
		) AS s
		LEFT JOIN test_schema.enriched_purchase AS enriched_purchase_1_tbl
			ON s.join_enriched_activity_id_1_a = enriched_purchase_1_tbl.enriched_activity_id
) AS after
		ON (
			c.join_customer = after.join_customer  AND
			c.join_cohort_id = after.join_cohort_id
		)
) AS sub_query
ORDER BY registration_timestamp DESC
