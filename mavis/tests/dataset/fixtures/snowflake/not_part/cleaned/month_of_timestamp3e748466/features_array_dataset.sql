WITH
cohort_stream AS (
	SELECT
		*
	FROM test_schema.activity_stream AS s
	WHERE (
		s.activity = 'started_pro_subscription'  AND
		s.ts >= CAST('2022-01-01T05:00:00.000Z' AS TIMESTAMP)
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
			s.ts AS timestamp
			, s.customer AS join_customer
			, s.ts AS join_ts
			, s.activity_id AS join_cohort_id
		FROM cohort_stream AS s
	) AS c
	WHERE c.timestamp >= CAST('2022-01-01T05:00:00.000Z' AS TIMESTAMP)
),
append_before AS (
	SELECT
		s.*
		, enrichment_table_tbl.utm_source_channel_grouping AS last_touch_channel
	FROM (
		SELECT
			join_customer
			, join_cohort_id
			, MAX(last_before_started_session_timestamp) AS last_before_started_session_timestamp
			, NULLIF(SUBSTRING(MAX(CONCAT(LEFT(CAST(s.last_before_started_session_timestamp as string), 19), NVL(join_enriched_activity_id_0_a,''))),20, 1000),'') AS join_enriched_activity_id_0_a
			, MAX(last_before_email_link_clicked_timestamp) AS last_before_email_link_clicked_timestamp
			, MAX(last_before_payment_transactions_timestamp) AS last_before_payment_transactions_timestamp
			, MAX(last_before_payment_transactions_revenue_impact) AS last_before_payment_transactions_revenue_impact
			, NULLIF(SUBSTRING(MAX(CONCAT(LEFT(CAST(s.last_before_payment_transactions_timestamp as string), 19), NVL(last_before_purchase_description_frequency,''))),20, 1000),'') AS last_before_purchase_description_frequency
		FROM (
			SELECT
				s.customer AS join_customer
				, c.join_cohort_id
				, s.ts
				, CASE WHEN ( s.activity = 'started_session' AND ABS(FLOOR(DATEDIFF(second, s.ts, c.join_ts)/86400)) < 30 ) THEN s.ts END AS last_before_started_session_timestamp
				, CASE WHEN ( s.activity = 'started_session' AND ABS(FLOOR(DATEDIFF(second, s.ts, c.join_ts)/86400)) < 30 ) THEN s.activity_id END AS join_enriched_activity_id_0_a
				, CASE WHEN ( s.activity = 'clicked_email_link' AND ( CAST(s.feature_json['a2'] AS VARCHAR(4096)) not ilike '%password reset%' OR CAST(s.feature_json['a2'] AS VARCHAR(4096)) not ilike '%validation%' ) AND ABS(FLOOR(DATEDIFF(second, s.ts, c.join_ts)/86400)) < 30 ) THEN s.ts END AS last_before_email_link_clicked_timestamp
				, CASE WHEN s.activity = 'payment' THEN s.ts END AS last_before_payment_transactions_timestamp
				, CASE WHEN ( s.activity = 'payment' AND ROW_NUMBER() over (PARTITION by s.activity, s.customer, c.join_cohort_id ORDER BY s.ts desc) = 1 ) THEN s.revenue_impact END AS last_before_payment_transactions_revenue_impact
				, CASE WHEN s.activity = 'payment' THEN CAST(s.feature_json['a1'] AS VARCHAR(4096)) END AS last_before_purchase_description_frequency
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
			c.timestamp
			, before.last_before_started_session_timestamp
			, before.last_before_email_link_clicked_timestamp
			, before.last_before_payment_transactions_timestamp
			, before.last_before_payment_transactions_revenue_impact
			, before.last_before_purchase_description_frequency
			, before.last_touch_channel
			, CASE WHEN last_before_started_session_timestamp is not NULL THEN 1 ELSE 0 END AS did_started_session_before
			, FLOOR(DATEDIFF(second, last_before_started_session_timestamp, join_ts)/86400) AS days_from_started_session
			, CASE WHEN last_before_email_link_clicked_timestamp is not NULL THEN 1 ELSE 0 END AS did_email_link_clicked_before
			, FLOOR(DATEDIFF(second, last_before_email_link_clicked_timestamp, join_ts)/86400) AS days_from_email_link_clicked
			, CASE WHEN last_before_payment_transactions_timestamp is not NULL THEN 1 ELSE 0 END AS did_payment_transactions_before
			, FLOOR(DATEDIFF(second, last_before_payment_transactions_timestamp, join_ts)/86400) AS days_from_payment_transactions
			, DATE_TRUNC(month, timestamp) AS month_of_timestamp
		FROM cohort AS c
		LEFT JOIN append_before AS before
			ON (
				c.join_customer = before.join_customer  AND
				c.join_cohort_id = before.join_cohort_id
			)
	)
	WHERE (
		did_email_link_clicked_before = 1.0  AND
		last_before_purchase_description_frequency not ilike '%recurring%'
	)
)
SELECT
	rd.month_of_timestamp AS month_of_timestamp
	, rd.last_touch_channel AS last_touch_channel
	, COUNT(1) AS total_started_pro_subscription_rows
	, SUM(rd.did_started_session_before) AS total_started_session
	, AVG(1.0000*rd.did_started_session_before) AS percent_of_started_session
	, AVG(1.0000*rd.days_from_started_session) AS average_days_from_started_session
	, SUM(rd.did_email_link_clicked_before) AS total_email_link_clicked
	, AVG(1.0000*rd.did_email_link_clicked_before) AS percent_of_email_link_clicked
	, AVG(1.0000*rd.days_from_email_link_clicked) AS average_days_from_email_link_clicked
	, SUM(rd.did_payment_transactions_before) AS total_payment_transactions
	, AVG(1.0000*rd.did_payment_transactions_before) AS percent_of_payment_transactions
	, AVG(1.0000*rd.days_from_payment_transactions) AS average_days_from_payment_transactions
	, SUM(rd.last_before_payment_transactions_revenue_impact) AS total_last_before_payment_transactions_revenue_impact
FROM raw_dataset AS rd
GROUP BY rd.month_of_timestamp, rd.last_touch_channel
ORDER BY month_of_timestamp DESC
