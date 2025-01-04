WITH
cohort_stream AS (
	SELECT
		*
	FROM test_schema.activity_stream_received_email AS s
),
before_stream AS (
	SELECT
		*
	FROM test_schema.activity_stream_started_marketing_session AS s
),
ever_stream AS (
	SELECT
		*
	FROM test_schema.activity_stream_company_started_subscription AS s
),
in_between_stream AS (
	SELECT
		*
	FROM test_schema.activity_stream_viewed_dashboard AS s
),
cohort AS (
	SELECT
		s.activity_id
		, s.ts AS timestamp
		, s.customer
		, COALESCE(s.customer, s.anonymous_customer_id) AS unique_identifier
		, CAST(s.feature_json['a1'] AS VARCHAR(4096)) AS tag
		, CAST(s.feature_json['a2'] AS VARCHAR(4096)) AS subject
		, CAST(s.feature_json['a3'] AS VARCHAR(4096)) AS body
		, s.link
		, ROW_NUMBER() over (PARTITION by COALESCE(s.customer, s.anonymous_customer_id) ORDER BY s.ts) AS activity_occurrence
		, COALESCE(s.customer, s.anonymous_customer_id) AS join_customer
		, s.ts AS join_ts
		, s.activity_id AS join_cohort_id
		, LEAD(s.ts) over (PARTITION by COALESCE(s.customer, s.anonymous_customer_id) ORDER BY s.ts) AS join_cohort_next_ts
	FROM cohort_stream AS s
	ORDER BY timestamp DESC
),
append_before AS (
	SELECT
		s.*
		, enriched_pages_tbl.ad_source AS last_before_ad_source
		, enriched_pages_tbl.device AS last_before_device
		, enriched_pages_tbl.enriched_activity_id AS last_before_started_marketing_sessions_enriched_activity_id
		, enriched_pages_tbl.enriched_ts AS last_before_started_marketing_sessions_enriched_ts
		, enriched_pages_tbl.fbclid AS last_before_fbclid
		, enriched_pages_tbl.ip_address AS last_before_ip_address
	FROM (
		SELECT
			COALESCE(s.customer, s.anonymous_customer_id) AS join_customer
			, c.join_cohort_id
			, MAX(CASE WHEN ( s.activity = 'started_marketing_session' AND ABS(FLOOR(DATEDIFF(second, s.ts, c.join_ts)/86400)) < 30 ) THEN s.ts END) AS last_before_started_marketing_sessions_timestamp
			, NULLIF(SUBSTRING(MAX(CASE WHEN ( s.activity = 'started_marketing_session' AND ABS(FLOOR(DATEDIFF(second, s.ts, c.join_ts)/86400)) < 30 ) THEN CONCAT(LEFT(CAST(s.ts as string), 19), NVL(s.activity_id,'')) END ),20, 1000),'') AS join_enriched_activity_id_0_a
		FROM cohort AS c
		INNER JOIN before_stream AS s
			ON (
				COALESCE(s.customer, s.anonymous_customer_id) = c.join_customer  AND
				ABS(FLOOR(DATEDIFF(second, s.ts, c.join_ts)/86400)) < 30  AND
				s.ts < c.join_ts
			)
		GROUP BY COALESCE(s.customer, s.anonymous_customer_id), c.join_cohort_id
	) AS s
	LEFT JOIN dw_internal.enriched_pages AS enriched_pages_tbl
		ON s.join_enriched_activity_id_0_a = enriched_pages_tbl.enriched_activity_id
),
append_ever AS (
	SELECT
		COALESCE(s.customer, s.anonymous_customer_id) AS join_customer
		, MIN(CASE WHEN ( s.activity = 'company_started_subscription' AND s.link is not NULL ) THEN s.ts END) AS first_ever_company_started_subscriptions_timestamp
		, NULLIF(SUBSTRING(MIN(CASE WHEN ( s.activity = 'company_started_subscription' AND s.link is not NULL ) THEN CONCAT(LEFT(CAST(s.ts as string), 19), NVL(s.link,'')) END ),20, 1000),'') AS first_ever_company_started_subscriptions_link
	FROM ever_stream AS s
	GROUP BY COALESCE(s.customer, s.anonymous_customer_id)
),
append_in_between AS (
	SELECT
		join_customer
		, join_cohort_id
		, MIN(first_in_between_viewed_dashboards_timestamp) AS first_in_between_viewed_dashboards_timestamp
		, NULLIF(SUBSTRING(MIN(CONCAT(LEFT(CAST(s.first_in_between_viewed_dashboards_timestamp as string), 19), NVL(first_in_between_company_slug,''))),20, 1000),'') AS first_in_between_company_slug
		, NULLIF(SUBSTRING(MIN(CONCAT(LEFT(CAST(s.first_in_between_viewed_dashboards_timestamp as string), 19), NVL(first_in_between_slug,''))),20, 1000),'') AS first_in_between_slug
	FROM (
		SELECT
			COALESCE(s.customer, s.anonymous_customer_id) AS join_customer
			, c.join_cohort_id
			, s.ts
			, CASE WHEN ( s.activity = 'viewed_dashboard' AND ABS(FLOOR(DATEDIFF(second, c.join_ts, s.ts)/60)) < 30 ) THEN s.ts END AS first_in_between_viewed_dashboards_timestamp
			, CASE WHEN ( s.activity = 'viewed_dashboard' AND ABS(FLOOR(DATEDIFF(second, c.join_ts, s.ts)/60)) < 30 ) THEN CAST(s.feature_json['company_slug'] AS VARCHAR(4096)) END AS first_in_between_company_slug
			, CASE WHEN ( s.activity = 'viewed_dashboard' AND ABS(FLOOR(DATEDIFF(second, c.join_ts, s.ts)/60)) < 30 ) THEN CAST(s.feature_json['slug'] AS VARCHAR(4096)) END AS first_in_between_slug
		FROM cohort AS c
		INNER JOIN in_between_stream AS s
			ON (
				COALESCE(s.customer, s.anonymous_customer_id) = c.join_customer  AND
				ABS(FLOOR(DATEDIFF(second, c.join_ts, s.ts)/60)) < 30  AND
				s.ts > c.join_ts  AND
				s.ts <= COALESCE(c.join_cohort_next_ts, CAST('2100-01-01' AS DATE))
			)
	) AS s
	GROUP BY join_customer, join_cohort_id
)
SELECT
	c.activity_id
	, c.timestamp
	, c.customer
	, c.unique_identifier
	, c.tag
	, c.subject
	, c.body
	, c.link
	, c.activity_occurrence
	, before.last_before_started_marketing_sessions_timestamp
	, before.last_before_ad_source
	, before.last_before_device
	, before.last_before_started_marketing_sessions_enriched_activity_id
	, before.last_before_started_marketing_sessions_enriched_ts
	, before.last_before_fbclid
	, before.last_before_ip_address
	, ever.first_ever_company_started_subscriptions_timestamp
	, ever.first_ever_company_started_subscriptions_link
	, in_between.first_in_between_viewed_dashboards_timestamp
	, in_between.first_in_between_company_slug
	, in_between.first_in_between_slug
	, CASE WHEN last_before_started_marketing_sessions_timestamp is not NULL THEN 1 ELSE 0 END AS did_started_marketing_session_before
	, FLOOR(DATEDIFF(second, last_before_started_marketing_sessions_timestamp, join_ts)/86400) AS days_from_started_marketing_session
	, CASE WHEN first_ever_company_started_subscriptions_timestamp is not NULL THEN 1 ELSE 0 END AS did_company_started_subscription_ever
	, FLOOR(DATEDIFF(second, first_ever_company_started_subscriptions_timestamp, join_ts)/86400) AS days_from_company_started_subscription
	, CASE WHEN first_in_between_viewed_dashboards_timestamp is not NULL THEN 1 ELSE 0 END AS did_viewed_dashboard_between
	, FLOOR(DATEDIFF(second, join_ts, first_in_between_viewed_dashboards_timestamp)/86400) AS days_to_viewed_dashboard
FROM cohort AS c
LEFT JOIN append_before AS before
	ON (
		c.join_customer = before.join_customer  AND
		c.join_cohort_id = before.join_cohort_id
	)
LEFT JOIN append_ever AS ever
	ON c.join_customer = ever.join_customer
LEFT JOIN append_in_between AS in_between
	ON (
		c.join_customer = in_between.join_customer  AND
		c.join_cohort_id = in_between.join_cohort_id
	)
ORDER BY timestamp DESC
