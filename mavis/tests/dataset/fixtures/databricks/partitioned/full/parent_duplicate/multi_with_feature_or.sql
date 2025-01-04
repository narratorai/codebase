WITH
cohort_stream AS (
	SELECT
		*
	FROM test_schema.company_stream_updated_subscription AS s
),
ever_stream AS (
	SELECT
		*
	FROM test_schema.company_stream_submitted_nps_score AS s
	UNION ALL
		SELECT
		*
	FROM test_schema.company_stream_received_invoice AS s
	UNION ALL
		SELECT
		*
	FROM test_schema.company_stream_paid_invoice AS s
	UNION ALL
		SELECT
		*
	FROM test_schema.company_stream_created_sales_order AS s
	UNION ALL
		SELECT
		*
	FROM test_schema.company_stream_created_purchase_order AS s
	UNION ALL
		SELECT
		*
	FROM test_schema.company_stream_created_metric_transaction AS s
	UNION ALL
		SELECT
		*
	FROM test_schema.company_stream_created_manufacturing_run AS s
	UNION ALL
		SELECT
		*
	FROM test_schema.company_stream_closed_won_deal AS s
),
cohort AS (
	SELECT
		*
	FROM (
		SELECT
			*
		FROM (
			SELECT
				s.activity_id AS last_activity_id
				, s.ts AS timestamp
				, s.customer
				, s.feature_json:a1 AS last_update_kind
				, s.revenue_impact AS current_subscription_value
				, customer_tbl.city
				, customer_tbl.lifecycle_stage
				, customer_tbl.hubspot_company_link
				, s.customer AS join_customer
				, s.ts AS join_ts
				, LEAD(s.ts) over (PARTITION by s.customer ORDER BY s.ts) AS join_cohort_next_ts
				, s.activity_id AS join_cohort_id
			FROM cohort_stream AS s
			LEFT JOIN test_schema.customer AS customer_tbl
				ON s.customer = customer_tbl.customer
		) AS s
		WHERE s.join_cohort_next_ts is NULL
	) AS c
	WHERE c.last_update_kind <> 'churn'
),
append_ever AS (
	SELECT
		join_customer
		, COUNT(total_transactions_in_last_7_days) AS total_transactions_in_last_7_days
		, MAX(last_used_product_at) AS last_used_product_at
		, MAX(last_ever_submitted_nps_score_timestamp) AS last_ever_submitted_nps_score_timestamp
		, MAX(last_nps_score) AS last_nps_score
		, NULLIF(SUBSTRING(MAX(CONCAT(LEFT(s.last_ever_submitted_nps_score_timestamp, 19), NVL(nps_score_submitted_by,''))),20, 1000),'') AS nps_score_submitted_by
		, MIN(first_ever_closed_won_deal_timestamp) AS first_ever_closed_won_deal_timestamp
		, SUM(total_invoiced) AS total_invoiced
		, SUM(total_paid) AS total_paid
		, MAX(last_deal_closed_at) AS last_deal_closed_at
		, NULLIF(SUBSTRING(MAX(CONCAT(LEFT(s.last_deal_closed_at, 19), NVL(sales_person,''))),20, 1000),'') AS sales_person
	FROM (
		SELECT
			s.customer AS join_customer
			, s.ts
			, CASE WHEN ( s.activity in ('created_manufacturing_run', 'created_sales_order', 'created_purchase_order', 'created_metric_transaction') AND s.ts >= dateadd(day, -7, NOW()) ) THEN s.ts END AS total_transactions_in_last_7_days
			, CASE WHEN ( s.activity in ('created_manufacturing_run', 'created_sales_order', 'created_purchase_order', 'created_metric_transaction') AND s.ts >= dateadd(day, -7, NOW()) ) THEN s.ts END AS last_used_product_at
			, CASE WHEN ( s.activity = 'submitted_nps_score' AND CASE WHEN s.feature_json:a3 in (NULL, '') THEN NULL ELSE (LOWER(s.feature_json:a3) = 'true') END = True ) THEN s.ts END AS last_ever_submitted_nps_score_timestamp
			, CASE WHEN ( s.activity = 'submitted_nps_score' AND CASE WHEN s.feature_json:a3 in (NULL, '') THEN NULL ELSE (LOWER(s.feature_json:a3) = 'true') END = True AND ROW_NUMBER() over (PARTITION by s.activity, s.customer, CASE WHEN CASE WHEN s.feature_json:a3 in (NULL, '') THEN NULL ELSE (LOWER(s.feature_json:a3) = 'true') END = True THEN 1 END ORDER BY s.ts desc) = 1 ) THEN FLOAT(s.feature_json:a1) END AS last_nps_score
			, CASE WHEN ( s.activity = 'submitted_nps_score' AND CASE WHEN s.feature_json:a3 in (NULL, '') THEN NULL ELSE (LOWER(s.feature_json:a3) = 'true') END = True ) THEN s.feature_json:a3 END AS nps_score_submitted_by
			, CASE WHEN s.activity = 'closed_won_deal' THEN s.ts END AS first_ever_closed_won_deal_timestamp
			, CASE WHEN s.activity = 'received_invoice' THEN s.revenue_impact END AS total_invoiced
			, CASE WHEN s.activity = 'paid_invoice' THEN s.revenue_impact END AS total_paid
			, CASE WHEN s.activity = 'closed_won_deal' THEN s.ts END AS last_deal_closed_at
			, CASE WHEN s.activity = 'closed_won_deal' THEN s.feature_json:a3 END AS sales_person
		FROM ever_stream AS s
	) AS s
	GROUP BY join_customer
),
raw_dataset AS (
	SELECT
		c.last_activity_id
		, c.timestamp
		, c.customer
		, c.last_update_kind
		, c.current_subscription_value
		, c.city
		, c.lifecycle_stage
		, c.hubspot_company_link
		, NVL(ever.total_transactions_in_last_7_days, 0) AS total_transactions_in_last_7_days
		, ever.last_used_product_at
		, ever.last_ever_submitted_nps_score_timestamp
		, ever.last_nps_score
		, ever.nps_score_submitted_by
		, ever.first_ever_closed_won_deal_timestamp
		, NVL(ever.total_invoiced, 0) AS total_invoiced
		, NVL(ever.total_paid, 0) AS total_paid
		, ever.last_deal_closed_at
		, ever.sales_person
		, FLOOR(datediff(second, first_ever_closed_won_deal_timestamp, NOW())/2592000) AS tenure_in_months
		, FLOOR(datediff(second, last_used_product_at, NOW())/86400) AS days_since_last_transaction
		, DATE_TRUNC('day', last_ever_submitted_nps_score_timestamp) AS last_nps_date
	FROM cohort AS c
	LEFT JOIN append_ever AS ever
		ON c.join_customer = ever.join_customer
)
SELECT
	rd.customer
	, rd.current_subscription_value
	, rd.hubspot_company_link
	, rd.total_transactions_in_last_7_days
	, rd.last_nps_score
	, rd.nps_score_submitted_by
	, rd.total_invoiced
	, rd.total_paid
	, rd.last_deal_closed_at
	, rd.sales_person
	, rd.tenure_in_months
	, rd.days_since_last_transaction
	, rd.last_nps_date
FROM raw_dataset AS rd
ORDER BY timestamp DESC
