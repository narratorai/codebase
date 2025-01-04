WITH
cohort_stream AS (
	SELECT
		*
	FROM test_schema.activity_stream AS s
	WHERE (
		s.activity = 'started_pro_subscription'  AND
		s.ts >= CAST('2022-01-01T05:00:00.000' AS DATETIME)
	)
),
before_stream AS (
	SELECT
		*
	FROM test_schema.activity_stream AS s
	WHERE s.activity in ('clicked_email_link', 'payment', 'started_session')
),
cohort AS (
	SELECT
		*
	FROM (
		SELECT
			s.activity_id
			, s.ts AS "timestamp"
			, s.customer
			, JSON_VALUE(s.feature_json, '$.a1') AS "plan_type"
			, CASE WHEN JSON_VALUE(s.feature_json, '$.a2') in (NULL, '') THEN NULL ELSE (LOWER(JSON_VALUE(s.feature_json, '$.a2')) = 'true') END AS "trial_plan"
			, ROW_NUMBER() over (PARTITION by s.customer ORDER BY s.ts) AS "activity_occurrence"
			, s.customer AS "join_customer"
			, s.ts AS "join_ts"
			, s.activity_id AS "join_cohort_id"
		FROM cohort_stream AS s
	) AS c
	WHERE c.timestamp >= CAST('2022-01-01T05:00:00.000' AS DATETIME)
),
append_before AS (
	SELECT
		s.*
		, enrichment_table_tbl.utm_source_channel_grouping AS "last_touch_channel"
	FROM (
		SELECT
			join_customer
			, join_cohort_id
			, MAX(last_before_started_session_timestamp) AS "last_before_started_session_timestamp"
			, NULLIF(SUBSTRING(MAX(CONCAT(LEFT(s.last_before_started_session_timestamp, 19), COALESCE(join_enriched_activity_id_0_a,''))),20, 1000),'') AS "join_enriched_activity_id_0_a"
			, MAX(last_before_email_link_clicked_timestamp) AS "last_before_email_link_clicked_timestamp"
			, NULLIF(SUBSTRING(MAX(CONCAT(LEFT(s.last_before_email_link_clicked_timestamp, 19), COALESCE(last_before_email_link_clicked_link,''))),20, 1000),'') AS "last_before_email_link_clicked_link"
			, NULLIF(SUBSTRING(MAX(CONCAT(LEFT(s.last_before_email_link_clicked_timestamp, 19), COALESCE(last_before_campaign_name,''))),20, 1000),'') AS "last_before_campaign_name"
			, MAX(last_before_payment_transactions_timestamp) AS "last_before_payment_transactions_timestamp"
			, NULLIF(SUBSTRING(MAX(CONCAT(LEFT(s.last_before_payment_transactions_timestamp, 19), COALESCE(last_before_pro_type,''))),20, 1000),'') AS "last_before_pro_type"
			, MAX(last_before_payment_transactions_activity_occurrence) AS "last_before_payment_transactions_activity_occurrence"
			, MAX(last_before_payment_transactions_revenue_impact) AS "last_before_payment_transactions_revenue_impact"
			, NULLIF(SUBSTRING(MAX(CONCAT(LEFT(s.last_before_payment_transactions_timestamp, 19), COALESCE(last_before_purchase_description_frequency,''))),20, 1000),'') AS "last_before_purchase_description_frequency"
		FROM (
			SELECT
				s.customer AS "join_customer"
				, c.join_cohort_id
				, s.ts
				, CASE WHEN ( s.activity = 'started_session' AND ABS(FLOOR(DATEDIFF(second, s.ts, c.join_ts)/86400)) < 30 ) THEN s.ts END AS "last_before_started_session_timestamp"
				, CASE WHEN ( s.activity = 'started_session' AND ABS(FLOOR(DATEDIFF(second, s.ts, c.join_ts)/86400)) < 30 ) THEN s.activity_id END AS "join_enriched_activity_id_0_a"
				, CASE WHEN ( s.activity = 'clicked_email_link' AND ( LOWER(JSON_VALUE(s.feature_json, '$.a2')) not like '%password reset%' OR LOWER(JSON_VALUE(s.feature_json, '$.a2')) not like '%validation%' ) AND ABS(FLOOR(DATEDIFF(second, s.ts, c.join_ts)/86400)) < 30 ) THEN s.ts END AS "last_before_email_link_clicked_timestamp"
				, CASE WHEN ( s.activity = 'clicked_email_link' AND ( LOWER(JSON_VALUE(s.feature_json, '$.a2')) not like '%password reset%' OR LOWER(JSON_VALUE(s.feature_json, '$.a2')) not like '%validation%' ) AND ABS(FLOOR(DATEDIFF(second, s.ts, c.join_ts)/86400)) < 30 ) THEN s.link END AS "last_before_email_link_clicked_link"
				, CASE WHEN ( s.activity = 'clicked_email_link' AND ( LOWER(JSON_VALUE(s.feature_json, '$.a2')) not like '%password reset%' OR LOWER(JSON_VALUE(s.feature_json, '$.a2')) not like '%validation%' ) AND ABS(FLOOR(DATEDIFF(second, s.ts, c.join_ts)/86400)) < 30 ) THEN JSON_VALUE(s.feature_json, '$.a2') END AS "last_before_campaign_name"
				, CASE WHEN s.activity = 'payment' THEN s.ts END AS "last_before_payment_transactions_timestamp"
				, CASE WHEN s.activity = 'payment' THEN JSON_VALUE(s.feature_json, '$.a3') END AS "last_before_pro_type"
				, CASE WHEN ( s.activity = 'payment' AND ROW_NUMBER() over (PARTITION by s.activity, s.customer, c.join_cohort_id ORDER BY s.ts desc) = 1 ) THEN s.activity_occurrence END AS "last_before_payment_transactions_activity_occurrence"
				, CASE WHEN ( s.activity = 'payment' AND ROW_NUMBER() over (PARTITION by s.activity, s.customer, c.join_cohort_id ORDER BY s.ts desc) = 1 ) THEN s.revenue_impact END AS "last_before_payment_transactions_revenue_impact"
				, CASE WHEN s.activity = 'payment' THEN JSON_VALUE(s.feature_json, '$.a1') END AS "last_before_purchase_description_frequency"
			FROM cohort AS c
			INNER JOIN before_stream AS s
				ON (
					s.customer = c.join_customer  AND
					s.ts < c.join_ts
				)
		) AS s
		GROUP BY join_customer, join_cohort_id
	) AS s
	LEFT JOIN test_schema.enrichment_table AS enrichment_table_tbl
		ON s.join_enriched_activity_id_0_a = enrichment_table_tbl.enriched_activity_id
),
raw_dataset AS (
	SELECT
		*
	FROM (
		SELECT
			c.activity_id
			, c.timestamp
			, c.customer
			, c.plan_type
			, c.trial_plan
			, c.activity_occurrence
			, before.last_before_started_session_timestamp
			, before.last_before_email_link_clicked_timestamp
			, before.last_before_email_link_clicked_link
			, before.last_before_campaign_name
			, before.last_before_payment_transactions_timestamp
			, before.last_before_pro_type
			, before.last_before_payment_transactions_activity_occurrence
			, before.last_before_payment_transactions_revenue_impact
			, before.last_before_purchase_description_frequency
			, before.last_touch_channel
			, CASE WHEN last_before_started_session_timestamp is not NULL THEN 1 ELSE 0 END AS "did_started_session_before"
			, FLOOR(DATEDIFF(second, last_before_started_session_timestamp, join_ts)/86400) AS "days_from_started_session"
			, CASE WHEN last_before_email_link_clicked_timestamp is not NULL THEN 1 ELSE 0 END AS "did_email_link_clicked_before"
			, FLOOR(DATEDIFF(second, last_before_email_link_clicked_timestamp, join_ts)/86400) AS "days_from_email_link_clicked"
			, CASE WHEN last_before_payment_transactions_timestamp is not NULL THEN 1 ELSE 0 END AS "did_payment_transactions_before"
			, FLOOR(DATEDIFF(second, last_before_payment_transactions_timestamp, join_ts)/86400) AS "days_from_payment_transactions"
			, DATEADD(month, datediff(month, 0, timestamp), 0) AS "month_of_timestamp"
		FROM cohort AS c
		LEFT JOIN append_before AS before
			ON (
				c.join_customer = before.join_customer  AND
				c.join_cohort_id = before.join_cohort_id
			)
	) AS sub_query
	WHERE (
		did_email_link_clicked_before = 1.0  AND
		LOWER(last_before_purchase_description_frequency) not like '%recurring%'
	)
)
SELECT
	*
	, total_started_pro_subscription_rows / NULLIF(SUM(total_started_pro_subscription_rows) OVER (), 0) AS "percent_of_email_link_clicked"
FROM (
	SELECT
		rd.last_before_campaign_name AS "last_before_campaign_name"
		, COUNT(1) AS "total_started_pro_subscription_rows"
		, SUM(rd.did_started_session_before) AS "total_started_session"
		, AVG(1.000 * rd.did_started_session_before) AS "percent_of_started_session"
		, AVG(1.000 * rd.days_from_started_session) AS "average_days_from_started_session"
		, SUM(rd.did_email_link_clicked_before) AS "total_email_link_clicked"
		, AVG(1.000 * rd.days_from_email_link_clicked) AS "average_days_from_email_link_clicked"
		, SUM(rd.did_payment_transactions_before) AS "total_payment_transactions"
		, AVG(1.000 * rd.did_payment_transactions_before) AS "percent_of_payment_transactions"
		, AVG(1.000 * rd.days_from_payment_transactions) AS "average_days_from_payment_transactions"
		, SUM(rd.last_before_payment_transactions_revenue_impact) AS "total_last_before_payment_transactions_revenue_impact"
	FROM raw_dataset AS rd
	GROUP BY rd.last_before_campaign_name
) AS sub_query
ORDER BY total_started_pro_subscription_rows DESC
