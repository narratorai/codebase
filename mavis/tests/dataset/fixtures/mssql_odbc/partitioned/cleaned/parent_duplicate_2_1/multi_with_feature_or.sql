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
				s.ts AS "timestamp"
				, s.customer
				, JSON_VALUE(s.feature_json, '$.a1') AS "last_update_kind"
				, s.revenue_impact AS "current_subscription_value"
				, customer_tbl.hubspot_company_link
				, s.customer AS "join_customer"
				, s.ts AS "join_ts"
				, LEAD(s.ts) over (PARTITION by s.customer ORDER BY s.ts) AS "join_cohort_next_ts"
				, s.activity_id AS "join_cohort_id"
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
		, COUNT(total_transactions_in_last_7_days) AS "total_transactions_in_last_7_days"
		, MAX(last_used_product_at) AS "last_used_product_at"
		, MAX(last_ever_submitted_nps_score_timestamp) AS "last_ever_submitted_nps_score_timestamp"
		, MAX(last_nps_score) AS "last_nps_score"
		, NULLIF(SUBSTRING(MAX(CONCAT(LEFT(s.last_ever_submitted_nps_score_timestamp, 19), COALESCE(nps_score_submitted_by,''))),20, 1000),'') AS "nps_score_submitted_by"
		, MIN(first_ever_closed_won_deal_timestamp) AS "first_ever_closed_won_deal_timestamp"
		, SUM(total_invoiced) AS "total_invoiced"
		, SUM(total_paid) AS "total_paid"
		, MAX(last_deal_closed_at) AS "last_deal_closed_at"
		, NULLIF(SUBSTRING(MAX(CONCAT(LEFT(s.last_deal_closed_at, 19), COALESCE(sales_person,''))),20, 1000),'') AS "sales_person"
	FROM (
		SELECT
			s.customer AS "join_customer"
			, s.ts
			, CASE WHEN ( s.activity in ('created_manufacturing_run', 'created_sales_order', 'created_purchase_order', 'created_metric_transaction') AND s.ts >= DATEADD(day, -7, CURRENT_TIMESTAMP) ) THEN s.ts END AS "total_transactions_in_last_7_days"
			, CASE WHEN ( s.activity in ('created_manufacturing_run', 'created_sales_order', 'created_purchase_order', 'created_metric_transaction') AND s.ts >= DATEADD(day, -7, CURRENT_TIMESTAMP) ) THEN s.ts END AS "last_used_product_at"
			, CASE WHEN ( s.activity = 'submitted_nps_score' AND CASE WHEN JSON_VALUE(s.feature_json, '$.a3') in (NULL, '') THEN NULL ELSE (LOWER(JSON_VALUE(s.feature_json, '$.a3')) = 'true') END = True ) THEN s.ts END AS "last_ever_submitted_nps_score_timestamp"
			, CASE WHEN ( s.activity = 'submitted_nps_score' AND CASE WHEN JSON_VALUE(s.feature_json, '$.a3') in (NULL, '') THEN NULL ELSE (LOWER(JSON_VALUE(s.feature_json, '$.a3')) = 'true') END = True AND ROW_NUMBER() over (PARTITION by s.activity, s.customer, CASE WHEN CASE WHEN JSON_VALUE(s.feature_json, '$.a3') in (NULL, '') THEN NULL ELSE (LOWER(JSON_VALUE(s.feature_json, '$.a3')) = 'true') END = True THEN 1 END ORDER BY s.ts desc) = 1 ) THEN CAST(JSON_VALUE(s.feature_json, '$.a1') AS FLOAT) END AS "last_nps_score"
			, CASE WHEN ( s.activity = 'submitted_nps_score' AND CASE WHEN JSON_VALUE(s.feature_json, '$.a3') in (NULL, '') THEN NULL ELSE (LOWER(JSON_VALUE(s.feature_json, '$.a3')) = 'true') END = True ) THEN JSON_VALUE(s.feature_json, '$.a3') END AS "nps_score_submitted_by"
			, CASE WHEN s.activity = 'closed_won_deal' THEN s.ts END AS "first_ever_closed_won_deal_timestamp"
			, CASE WHEN s.activity = 'received_invoice' THEN s.revenue_impact END AS "total_invoiced"
			, CASE WHEN s.activity = 'paid_invoice' THEN s.revenue_impact END AS "total_paid"
			, CASE WHEN s.activity = 'closed_won_deal' THEN s.ts END AS "last_deal_closed_at"
			, CASE WHEN s.activity = 'closed_won_deal' THEN JSON_VALUE(s.feature_json, '$.a3') END AS "sales_person"
		FROM ever_stream AS s
	) AS s
	GROUP BY join_customer
),
raw_dataset AS (
	SELECT
		*
	FROM (
		SELECT
			c.timestamp
			, c.customer
			, c.last_update_kind
			, c.current_subscription_value
			, c.hubspot_company_link
			, COALESCE(ever.total_transactions_in_last_7_days, 0) AS "total_transactions_in_last_7_days"
			, ever.last_used_product_at
			, ever.last_ever_submitted_nps_score_timestamp
			, ever.last_nps_score
			, ever.nps_score_submitted_by
			, ever.first_ever_closed_won_deal_timestamp
			, COALESCE(ever.total_invoiced, 0) AS "total_invoiced"
			, COALESCE(ever.total_paid, 0) AS "total_paid"
			, ever.last_deal_closed_at
			, ever.sales_person
			, FLOOR(DATEDIFF(second, first_ever_closed_won_deal_timestamp, CURRENT_TIMESTAMP)/2592000) AS "tenure_in_months"
			, FLOOR(DATEDIFF(second, last_used_product_at, CURRENT_TIMESTAMP)/86400) AS "days_since_last_transaction"
			, DATEADD(day, datediff(day, 0, last_ever_submitted_nps_score_timestamp), 0) AS "last_nps_date"
		FROM cohort AS c
		LEFT JOIN append_ever AS ever
			ON c.join_customer = ever.join_customer
	) AS sub_query
	WHERE (
		total_transactions_in_last_7_days > 10.0  AND
		last_nps_score > 7.0
	)
)
SELECT
	rd.customer
	, rd.current_subscription_value
	, rd.hubspot_company_link
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
ORDER BY current_subscription_value DESC
