WITH
cohort_stream AS (
	SELECT
		*
	FROM test_schema.activity_stream_started_pro_subscription AS s
	WHERE s.ts >= SAFE_CAST( "2022-01-01T05:00:00.000Z" AS TIMESTAMP)
),
before_stream AS (
	SELECT
		*
	FROM test_schema.activity_stream_started_session AS s
	UNION ALL
		SELECT
		*
	FROM test_schema.activity_stream_payment AS s
	UNION ALL
		SELECT
		*
	FROM test_schema.activity_stream_clicked_email_link AS s
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
	WHERE c.timestamp >= SAFE_CAST( "2022-01-01T05:00:00.000Z" AS TIMESTAMP)
),
append_before AS (
	SELECT
		join_customer
		, join_cohort_id
		, MAX(last_before_started_session_timestamp) AS last_before_started_session_timestamp
		, MAX(last_before_email_link_clicked_timestamp) AS last_before_email_link_clicked_timestamp
		, NULLIF(SUBSTR(MAX(CONCAT(CAST(TIMESTAMP_TRUNC(s.last_before_email_link_clicked_timestamp, SECOND) AS string), coalesce(last_before_campaign_name,''))), 23, 1000), '') AS last_before_campaign_name
		, MAX(last_before_payment_transactions_timestamp) AS last_before_payment_transactions_timestamp
		, MAX(last_before_payment_transactions_revenue_impact) AS last_before_payment_transactions_revenue_impact
		, NULLIF(SUBSTR(MAX(CONCAT(CAST(TIMESTAMP_TRUNC(s.last_before_payment_transactions_timestamp, SECOND) AS string), coalesce(last_before_purchase_description_frequency,''))), 23, 1000), '') AS last_before_purchase_description_frequency
	FROM (
		SELECT
			s.customer AS join_customer
			, c.join_cohort_id
			, s.ts
			, CASE WHEN ( s.activity = "started_session" AND ABS(FLOOR(TIMESTAMP_DIFF(c.join_ts, s.ts, second)/86400)) < 30 ) THEN s.ts END AS last_before_started_session_timestamp
			, CASE WHEN ( s.activity = "clicked_email_link" AND ( lower(JSON_VALUE(s.feature_json['a2'])) not like "%password reset%" OR lower(JSON_VALUE(s.feature_json['a2'])) not like "%validation%" ) AND ABS(FLOOR(TIMESTAMP_DIFF(c.join_ts, s.ts, second)/86400)) < 30 ) THEN s.ts END AS last_before_email_link_clicked_timestamp
			, CASE WHEN ( s.activity = "clicked_email_link" AND ( lower(JSON_VALUE(s.feature_json['a2'])) not like "%password reset%" OR lower(JSON_VALUE(s.feature_json['a2'])) not like "%validation%" ) AND ABS(FLOOR(TIMESTAMP_DIFF(c.join_ts, s.ts, second)/86400)) < 30 ) THEN JSON_VALUE(s.feature_json['a2']) END AS last_before_campaign_name
			, CASE WHEN s.activity = "payment" THEN s.ts END AS last_before_payment_transactions_timestamp
			, CASE WHEN ( s.activity = "payment" AND ROW_NUMBER() over (PARTITION by s.activity, s.customer, c.join_cohort_id ORDER BY s.ts desc) = 1 ) THEN s.revenue_impact END AS last_before_payment_transactions_revenue_impact
			, CASE WHEN s.activity = "payment" THEN JSON_VALUE(s.feature_json['a1']) END AS last_before_purchase_description_frequency
		FROM cohort AS c
		INNER JOIN before_stream AS s
			ON (
				s.customer = c.join_customer  AND
				s.ts < c.join_ts
			)
	) AS s
	GROUP BY join_customer, join_cohort_id
),
raw_dataset AS (
	SELECT
		*
	FROM (
		SELECT
			c.timestamp
			, before.last_before_started_session_timestamp
			, before.last_before_email_link_clicked_timestamp
			, before.last_before_campaign_name
			, before.last_before_payment_transactions_timestamp
			, before.last_before_payment_transactions_revenue_impact
			, before.last_before_purchase_description_frequency
			, CASE WHEN last_before_started_session_timestamp is not NULL THEN 1 ELSE 0 END AS did_started_session_before
			, FLOOR(TIMESTAMP_DIFF(join_ts, last_before_started_session_timestamp, second)/86400) AS days_from_started_session
			, CASE WHEN last_before_email_link_clicked_timestamp is not NULL THEN 1 ELSE 0 END AS did_email_link_clicked_before
			, FLOOR(TIMESTAMP_DIFF(join_ts, last_before_email_link_clicked_timestamp, second)/86400) AS days_from_email_link_clicked
			, CASE WHEN last_before_payment_transactions_timestamp is not NULL THEN 1 ELSE 0 END AS did_payment_transactions_before
			, FLOOR(TIMESTAMP_DIFF(join_ts, last_before_payment_transactions_timestamp, second)/86400) AS days_from_payment_transactions
			, TIMESTAMP_TRUNC(timestamp, month) AS month_of_timestamp
		FROM cohort AS c
		LEFT JOIN append_before AS before
			ON (
				c.join_customer = before.join_customer  AND
				c.join_cohort_id = before.join_cohort_id
			)
	)
	WHERE (
		did_email_link_clicked_before = 1.0  AND
		lower(last_before_purchase_description_frequency) not like "%recurring%"
	)
)
SELECT
	rd.month_of_timestamp AS month_of_timestamp
	, rd.last_before_campaign_name AS last_before_campaign_name
	, COUNT(1) AS total_started_pro_subscription_rows
	, SUM(rd.did_started_session_before) AS total_started_session
	, AVG(1.000*rd.did_started_session_before) AS percent_of_started_session
	, AVG(1.000*rd.days_from_started_session) AS average_days_from_started_session
	, SUM(rd.did_email_link_clicked_before) AS total_email_link_clicked
	, AVG(1.000*rd.did_email_link_clicked_before) AS percent_of_email_link_clicked
	, AVG(1.000*rd.days_from_email_link_clicked) AS average_days_from_email_link_clicked
	, SUM(rd.did_payment_transactions_before) AS total_payment_transactions
	, AVG(1.000*rd.did_payment_transactions_before) AS percent_of_payment_transactions
	, AVG(1.000*rd.days_from_payment_transactions) AS average_days_from_payment_transactions
	, SUM(rd.last_before_payment_transactions_revenue_impact) AS total_last_before_payment_transactions_revenue_impact
FROM raw_dataset AS rd
GROUP BY month_of_timestamp, last_before_campaign_name
ORDER BY month_of_timestamp DESC
