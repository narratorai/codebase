WITH
cohort_stream AS (
	SELECT
		*
	FROM test_schema.activity_stream AS s
	WHERE s.activity = "received_email"
),
before_stream AS (
	SELECT
		*
	FROM test_schema.activity_stream AS s
	WHERE s.activity = "started_marketing_session"
),
ever_stream AS (
	SELECT
		*
	FROM test_schema.activity_stream AS s
	WHERE s.activity = "company_started_subscription"
),
in_between_stream AS (
	SELECT
		*
	FROM test_schema.activity_stream AS s
	WHERE s.activity = "viewed_dashboard"
),
cohort AS (
	SELECT
		s.activity_id
		, s.ts AS timestamp
		, s.customer
		, COALESCE(s.customer, s.anonymous_customer_id) AS unique_identifier
		, JSON_VALUE(s.feature_json['a1']) AS tag
		, JSON_VALUE(s.feature_json['a2']) AS subject
		, JSON_VALUE(s.feature_json['a3']) AS body
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
			, MAX(CASE WHEN ( s.activity = "started_marketing_session" AND ABS(FLOOR(TIMESTAMP_DIFF(c.join_ts, s.ts, second)/86400)) < 30 ) THEN s.ts END) AS last_before_started_marketing_sessions_timestamp
			, NULLIF(SUBSTR(MAX(CASE WHEN ( s.activity = "started_marketing_session" AND ABS(FLOOR(TIMESTAMP_DIFF(c.join_ts, s.ts, second)/86400)) < 30 ) THEN CONCAT(CAST(TIMESTAMP_TRUNC(s.ts, SECOND) AS string), coalesce(s.activity_id,'')) END), 23, 1000), '') AS join_enriched_activity_id_0_a
		FROM cohort AS c
		INNER JOIN before_stream AS s
			ON (
				COALESCE(s.customer, s.anonymous_customer_id) = c.join_customer  AND
				ABS(FLOOR(TIMESTAMP_DIFF(c.join_ts, s.ts, second)/86400)) < 30  AND
				s.ts < c.join_ts
			)
		GROUP BY join_customer, join_cohort_id
	) AS s
	LEFT JOIN dw_internal.enriched_pages AS enriched_pages_tbl
		ON s.join_enriched_activity_id_0_a = enriched_pages_tbl.enriched_activity_id
),
append_ever AS (
	SELECT
		COALESCE(s.customer, s.anonymous_customer_id) AS join_customer
		, MIN(CASE WHEN s.activity = "company_started_subscription" THEN s.ts END) AS first_ever_company_started_subscriptions_timestamp
		, NULLIF(SUBSTR(MIN(CASE WHEN s.activity = "company_started_subscription" THEN CONCAT(CAST(TIMESTAMP_TRUNC(s.ts, SECOND) AS string), COALESCE(s.link,'') ) END), 23, 1000), '') AS first_ever_company_started_subscriptions_link
	FROM ever_stream AS s
	GROUP BY join_customer
),
append_in_between AS (
	SELECT
		join_customer
		, join_cohort_id
		, MIN(first_in_between_viewed_dashboards_timestamp) AS first_in_between_viewed_dashboards_timestamp
		, NULLIF(SUBSTR(MIN(CONCAT(CAST(TIMESTAMP_TRUNC(s.first_in_between_viewed_dashboards_timestamp, SECOND) AS string), COALESCE(first_in_between_company_slug,'') )), 23, 1000), '') AS first_in_between_company_slug
		, NULLIF(SUBSTR(MIN(CONCAT(CAST(TIMESTAMP_TRUNC(s.first_in_between_viewed_dashboards_timestamp, SECOND) AS string), COALESCE(first_in_between_slug,'') )), 23, 1000), '') AS first_in_between_slug
	FROM (
		SELECT
			COALESCE(s.customer, s.anonymous_customer_id) AS join_customer
			, c.join_cohort_id
			, s.ts
			, CASE WHEN s.activity = "viewed_dashboard" THEN s.ts END AS first_in_between_viewed_dashboards_timestamp
			, CASE WHEN s.activity = "viewed_dashboard" THEN JSON_VALUE(s.feature_json['company_slug']) END AS first_in_between_company_slug
			, CASE WHEN s.activity = "viewed_dashboard" THEN JSON_VALUE(s.feature_json['slug']) END AS first_in_between_slug
		FROM cohort AS c
		INNER JOIN in_between_stream AS s
			ON (
				COALESCE(s.customer, s.anonymous_customer_id) = c.join_customer  AND
				s.ts > c.join_ts  AND
				s.ts <= COALESCE(c.join_cohort_next_ts, SAFE_CAST( "2100-01-01" AS TIMESTAMP))
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
	, FLOOR(TIMESTAMP_DIFF(join_ts, last_before_started_marketing_sessions_timestamp, second)/86400) AS days_from_started_marketing_session
	, CASE WHEN first_ever_company_started_subscriptions_timestamp is not NULL THEN 1 ELSE 0 END AS did_company_started_subscription_ever
	, FLOOR(TIMESTAMP_DIFF(join_ts, first_ever_company_started_subscriptions_timestamp, second)/86400) AS days_from_company_started_subscription
	, CASE WHEN first_in_between_viewed_dashboards_timestamp is not NULL THEN 1 ELSE 0 END AS did_viewed_dashboard_between
	, FLOOR(TIMESTAMP_DIFF(first_in_between_viewed_dashboards_timestamp, join_ts, second)/86400) AS days_to_viewed_dashboard
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
