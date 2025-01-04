WITH
cohort_stream AS (
	SELECT
		*
	FROM test_schema.activity_stream_created_account AS s
),
after_stream AS (
	SELECT
		*
	FROM test_schema.activity_stream_started_trial AS s
	UNION ALL
		SELECT
		*
	FROM test_schema.activity_stream_purchased_premium AS s
	UNION ALL
		SELECT
		*
	FROM test_schema.activity_stream_made_purchase AS s
	UNION ALL
		SELECT
		*
	FROM test_schema.activity_stream_bought_ppp AS s
),
cohort AS (
	SELECT
		*
	FROM (
		SELECT
			s.ts AS registration_timestamp
			, s.customer AS join_customer
			, s.ts AS join_ts
			, ROW_NUMBER() over (PARTITION by s.customer ORDER BY s.ts) AS join_activity_occurrence
			, s.activity_id AS join_cohort_id
		FROM cohort_stream AS s
	) AS s
	WHERE s.join_activity_occurrence = 1
),
append_after AS (
	SELECT
		s.customer AS join_customer
		, c.join_cohort_id
		, MIN(CASE WHEN s.activity = "started_trial" THEN s.ts END) AS first_trial_timestamp
		, MIN(CASE WHEN s.activity = "purchased_premium" THEN s.ts END) AS first_premium_purchase_timestamp
		, MIN(CASE WHEN s.activity = "bought_ppp" THEN s.ts END) AS first_ppp_bought_timestamp
		, COUNT(CASE WHEN ( s.activity in ("purchased_premium", "made_purchase") AND ABS(FLOOR(TIMESTAMP_DIFF(s.ts, c.join_ts, second)/86400)) < 100 AND ( enriched_purchase_tbl.is_change_during_sub_period <> True OR enriched_purchase_tbl.is_change_during_sub_period is NULL ) ) THEN s.ts END) AS total_purchases
		, SUM(CASE WHEN ( s.activity in ("purchased_premium", "made_purchase") AND ABS(FLOOR(TIMESTAMP_DIFF(s.ts, c.join_ts, second)/86400)) < 100 AND ( enriched_purchase_tbl.is_change_during_sub_period <> True OR enriched_purchase_tbl.is_change_during_sub_period is NULL ) ) THEN s.revenue_impact END) AS a_3_mo_ltv
		, MIN(CASE WHEN ( s.activity = "made_purchase" AND enriched_purchase_tbl.subscription_tier = "Boost" ) THEN s.ts END) AS first_boost_purchase_timestamp
	FROM cohort AS c
	INNER JOIN after_stream AS s
		ON (
			s.customer = c.join_customer  AND
			s.ts > c.join_ts
		)
	LEFT JOIN test_schema.enriched_purchase AS enriched_purchase_tbl
		ON s.activity_id = enriched_purchase_tbl.enriched_activity_id
	GROUP BY join_customer, join_cohort_id
),
raw_dataset AS (
	SELECT
		c.registration_timestamp
		, after.first_trial_timestamp
		, after.first_premium_purchase_timestamp
		, after.first_ppp_bought_timestamp
		, COALESCE(after.total_purchases, 0) AS total_purchases
		, COALESCE(after.a_3_mo_ltv, 0) AS a_3_mo_ltv
		, after.first_boost_purchase_timestamp
		, CASE WHEN first_trial_timestamp is not NULL THEN 1 ELSE 0 END AS did_redeem_trial
		, FLOOR(TIMESTAMP_DIFF(first_trial_timestamp, join_ts, second)/86400) AS days_to_first_redeem_trial
		, CASE WHEN first_premium_purchase_timestamp is not NULL THEN 1 ELSE 0 END AS did_purchased_premium
		, FLOOR(TIMESTAMP_DIFF(first_premium_purchase_timestamp, join_ts, second)/86400) AS days_to_first_purchased_premium
		, CASE WHEN first_ppp_bought_timestamp is not NULL THEN 1 ELSE 0 END AS did_trigger_bought_ppp
		, FLOOR(TIMESTAMP_DIFF(first_ppp_bought_timestamp, join_ts, second)/86400) AS days_to_first_bought_ppp
		, CASE WHEN first_boost_purchase_timestamp is not NULL THEN 1 ELSE 0 END AS did_purchase_boost
		, FLOOR(TIMESTAMP_DIFF(first_boost_purchase_timestamp, join_ts, second)/86400) AS days_to_first_boost_purchase
		, TIMESTAMP_TRUNC(registration_timestamp, month) AS month_of_registration_timestamp
	FROM cohort AS c
	LEFT JOIN append_after AS after
		ON (
			c.join_customer = after.join_customer  AND
			c.join_cohort_id = after.join_cohort_id
		)
)
SELECT
	*
	, (total_customers / NULLIF(SUM(total_customers) OVER (PARTITION BY month_of_registration_timestamp),0)) AS conversion_rate_to_purchase_boost
FROM (
	SELECT
		rd.month_of_registration_timestamp AS month_of_registration_timestamp
		, rd.did_purchase_boost AS did_purchase_boost
		, COUNT(1) AS total_customers
		, SUM(rd.did_redeem_trial) AS total_redeem_trial
		, AVG(1.000*rd.did_redeem_trial) AS conversion_rate_to_redeem_trial
		, AVG(1.000*rd.days_to_first_redeem_trial) AS average_days_to_first_redeem_trial
		, SUM(rd.did_purchased_premium) AS total_purchased_premium
		, AVG(1.000*rd.did_purchased_premium) AS conversion_rate_to_purchased_premium
		, AVG(1.000*rd.days_to_first_purchased_premium) AS average_days_to_first_purchased_premium
		, SUM(rd.did_trigger_bought_ppp) AS total_trigger_bought_ppp
		, AVG(1.000*rd.did_trigger_bought_ppp) AS conversion_rate_to_trigger_bought_ppp
		, AVG(1.000*rd.days_to_first_bought_ppp) AS average_days_to_first_bought_ppp
		, SUM(rd.total_purchases) AS total_purchases
		, AVG(1.000*rd.total_purchases) AS average_total_purchases
		, SUM(rd.a_3_mo_ltv) AS a_3_mo_ltv
		, AVG(1.000*rd.a_3_mo_ltv) AS average_3_mo_ltv
		, AVG(1.000*rd.days_to_first_boost_purchase) AS average_days_to_first_boost_purchase
	FROM raw_dataset AS rd
	GROUP BY month_of_registration_timestamp, did_purchase_boost
)
ORDER BY month_of_registration_timestamp DESC, did_purchase_boost ASC
