SELECT
	c.activity_id
	, c.timestamp
	, c.customer
	, c.unique_identifier
	, c.ad_source
	, c.referring_domain
	, c.device
	, c.link
	, c.activity_occurrence
	, c.utm_campaign
	, in_between.first_in_between_completed_order_timestamp
	, in_between.first_in_between_solved_ticket_timestamp
	, before.last_before_paid_invoice_timestamp
	, before.last_before_attended_meeting_timestamp
	, COALESCE(before.total_viewed_paywalls_before, 0) AS "total_viewed_paywalls_before"
	, COALESCE(ever.total_paid_invoices_ever, 0) AS "total_paid_invoices_ever"
	, ever.first_ever_attended_meeting_timestamp
	, relative_ever.first_ever_purchased_product_timestamp
	, relative_ever.first_ever_purchased_product_timestamp_1
	, CASE WHEN first_in_between_completed_order_timestamp is not NULL THEN 1 ELSE 0 END AS "did_completed_order_between"
	, floor(EXTRACT(EPOCH FROM (first_in_between_completed_order_timestamp - join_ts)) / 86400) AS "days_to_completed_order"
	, CASE WHEN last_before_paid_invoice_timestamp is not NULL THEN 1 ELSE 0 END AS "did_paid_invoice_before"
	, floor(EXTRACT(EPOCH FROM (join_ts - last_before_paid_invoice_timestamp)) / 86400) AS "days_from_paid_invoice"
	, CASE WHEN last_before_attended_meeting_timestamp is not NULL THEN 1 ELSE 0 END AS "did_attended_meeting_before"
	, floor(EXTRACT(EPOCH FROM (join_ts - last_before_attended_meeting_timestamp)) / 86400) AS "days_from_attended_meeting"
	, CASE WHEN first_ever_purchased_product_timestamp is not NULL THEN 1 ELSE 0 END AS "did_purchased_product_ever"
	, floor(EXTRACT(EPOCH FROM (join_ts - first_ever_purchased_product_timestamp)) / 86400) AS "days_from_purchased_product"
	, CASE WHEN first_ever_purchased_product_timestamp_1 is not NULL THEN 1 ELSE 0 END AS "did_purchased_product_ever_1"
	, floor(EXTRACT(EPOCH FROM (join_ts - first_ever_purchased_product_timestamp_1)) / 86400) AS "days_from_purchased_product_1"
	, CASE WHEN first_in_between_solved_ticket_timestamp is not NULL THEN 1 ELSE 0 END AS "did_solved_ticket_between"
	, floor(EXTRACT(EPOCH FROM (first_in_between_solved_ticket_timestamp - join_ts)) / 86400) AS "days_to_solved_ticket"
	, CASE WHEN first_ever_attended_meeting_timestamp is not NULL THEN 1 ELSE 0 END AS "did_attended_meeting_ever"
	, floor(EXTRACT(EPOCH FROM (join_ts - first_ever_attended_meeting_timestamp)) / 86400) AS "days_from_attended_meeting_1"
	, DATE_TRUNC('month', timestamp) AS "month_of_timestamp"
FROM (
 	SELECT
		s.activity_id
		, s.ts AS "timestamp"
		, s.customer
		, COALESCE(s.customer, s.anonymous_customer_id) AS "unique_identifier"
		, s.feature_json ->> 'a1' AS "ad_source"
		, s.feature_json ->> 'a2' AS "referring_domain"
		, s.feature_json ->> 'a3' AS "device"
		, s.link
		, ROW_NUMBER() over (PARTITION by COALESCE(s.customer, s.anonymous_customer_id) ORDER BY s.ts) AS "activity_occurrence"
		, enriched_pages_tbl.utm_campaign
		, customer_tbl.platform AS "app_platform"
		, s.utm_campaign AS "app_utm_campaign"
		, COALESCE(s.customer, s.anonymous_customer_id) AS "join_customer"
		, s.ts AS "join_ts"
		, s.activity_id AS "join_cohort_id"
		, LEAD(s.ts) over (PARTITION by COALESCE(s.customer, s.anonymous_customer_id) ORDER BY s.ts) AS "join_cohort_next_ts"
	FROM (
 		SELECT
			*
		FROM test_schema.activity_stream_started_session AS s
) AS s
	LEFT JOIN test_schema.customer AS customer_tbl
		ON s.customer = customer_tbl.customer
	LEFT JOIN test_schema.enriched_pages AS enriched_pages_tbl
		ON s.activity_id = enriched_pages_tbl.enriched_activity_id
	ORDER BY timestamp DESC
) AS c
LEFT JOIN (
 	SELECT
		join_customer
		, join_cohort_id
		, MIN(first_in_between_completed_order_timestamp) AS "first_in_between_completed_order_timestamp"
		, MIN(first_in_between_solved_ticket_timestamp) AS "first_in_between_solved_ticket_timestamp"
	FROM (
		SELECT
			s.customer AS "join_customer"
			, c.join_cohort_id
			, s.ts
			, CASE WHEN s.activity = 'completed_order' THEN s.ts END AS "first_in_between_completed_order_timestamp"
			, CASE WHEN ( s.activity = 'solved_ticket' AND s.ts < COALESCE(MAX(CASE WHEN s.activity = 'paid_invoice' THEN s.ts END) over (PARTITION by s.customer, c.join_cohort_id), CAST('2100-01-01' AS DATE)) ) THEN s.ts END AS "first_in_between_solved_ticket_timestamp"
		FROM (
 			SELECT
				s.activity_id
				, s.ts AS "timestamp"
				, s.customer
				, COALESCE(s.customer, s.anonymous_customer_id) AS "unique_identifier"
				, s.feature_json ->> 'a1' AS "ad_source"
				, s.feature_json ->> 'a2' AS "referring_domain"
				, s.feature_json ->> 'a3' AS "device"
				, s.link
				, ROW_NUMBER() over (PARTITION by COALESCE(s.customer, s.anonymous_customer_id) ORDER BY s.ts) AS "activity_occurrence"
				, enriched_pages_tbl.utm_campaign
				, customer_tbl.platform AS "app_platform"
				, s.utm_campaign AS "app_utm_campaign"
				, COALESCE(s.customer, s.anonymous_customer_id) AS "join_customer"
				, s.ts AS "join_ts"
				, s.activity_id AS "join_cohort_id"
				, LEAD(s.ts) over (PARTITION by COALESCE(s.customer, s.anonymous_customer_id) ORDER BY s.ts) AS "join_cohort_next_ts"
			FROM (
 				SELECT
					*
				FROM test_schema.activity_stream_started_session AS s
) AS s
			LEFT JOIN test_schema.customer AS customer_tbl
				ON s.customer = customer_tbl.customer
			LEFT JOIN test_schema.enriched_pages AS enriched_pages_tbl
				ON s.activity_id = enriched_pages_tbl.enriched_activity_id
			ORDER BY timestamp DESC
) AS c
		INNER JOIN (
 			SELECT
				*
			FROM test_schema.activity_stream_solved_ticket AS s
			UNION ALL
				SELECT
		*
	FROM test_schema.activity_stream_paid_invoice AS s
	UNION ALL
		SELECT
		*
	FROM test_schema.activity_stream_completed_order AS s
) AS s
			ON (
				s.customer = c.join_customer  AND
				s.ts > c.join_ts  AND
				s.ts <= COALESCE(c.join_cohort_next_ts, CAST('2100-01-01' AS DATE))
			)
	) AS s
	GROUP BY join_customer, join_cohort_id
) AS in_between
	ON (
		c.join_customer = in_between.join_customer  AND
		c.join_cohort_id = in_between.join_cohort_id
	)
LEFT JOIN (
 	SELECT
		s.customer AS "join_customer"
		, c.join_cohort_id
		, MAX(CASE WHEN ( s.activity = 'paid_invoice' AND ABS(floor(EXTRACT(EPOCH FROM (c.join_ts - s.ts)) / 86400)) < 30 ) THEN s.ts END) AS "last_before_paid_invoice_timestamp"
		, MAX(CASE WHEN ( s.activity = 'attended_meeting' AND ABS(floor(EXTRACT(EPOCH FROM (c.join_ts - s.ts)) / 86400)) < 20 ) THEN s.ts END) AS "last_before_attended_meeting_timestamp"
		, COUNT(CASE WHEN ( s.activity = 'viewed_paywall' AND ABS(floor(EXTRACT(EPOCH FROM (c.join_ts - s.ts)) / 60)) < 30 ) THEN s.ts END) AS "total_viewed_paywalls_before"
	FROM (
 		SELECT
			s.activity_id
			, s.ts AS "timestamp"
			, s.customer
			, COALESCE(s.customer, s.anonymous_customer_id) AS "unique_identifier"
			, s.feature_json ->> 'a1' AS "ad_source"
			, s.feature_json ->> 'a2' AS "referring_domain"
			, s.feature_json ->> 'a3' AS "device"
			, s.link
			, ROW_NUMBER() over (PARTITION by COALESCE(s.customer, s.anonymous_customer_id) ORDER BY s.ts) AS "activity_occurrence"
			, enriched_pages_tbl.utm_campaign
			, customer_tbl.platform AS "app_platform"
			, s.utm_campaign AS "app_utm_campaign"
			, COALESCE(s.customer, s.anonymous_customer_id) AS "join_customer"
			, s.ts AS "join_ts"
			, s.activity_id AS "join_cohort_id"
			, LEAD(s.ts) over (PARTITION by COALESCE(s.customer, s.anonymous_customer_id) ORDER BY s.ts) AS "join_cohort_next_ts"
		FROM (
 			SELECT
				*
			FROM test_schema.activity_stream_started_session AS s
) AS s
		LEFT JOIN test_schema.customer AS customer_tbl
			ON s.customer = customer_tbl.customer
		LEFT JOIN test_schema.enriched_pages AS enriched_pages_tbl
			ON s.activity_id = enriched_pages_tbl.enriched_activity_id
		ORDER BY timestamp DESC
) AS c
	INNER JOIN (
 		SELECT
			*
		FROM test_schema.activity_stream_viewed_paywall AS s
		UNION ALL
			SELECT
		*
	FROM test_schema.activity_stream_paid_invoice AS s
	UNION ALL
		SELECT
		*
	FROM test_schema.activity_stream_attended_meeting AS s
) AS s
		ON (
			s.customer = c.join_customer  AND
			ABS(floor(EXTRACT(EPOCH FROM (c.join_ts - s.ts)) / 86400)) < 30  AND
			s.ts < c.join_ts
		)
	GROUP BY s.customer, c.join_cohort_id
) AS before
	ON (
		c.join_customer = before.join_customer  AND
		c.join_cohort_id = before.join_cohort_id
	)
LEFT JOIN (
 	SELECT
		s.customer AS "join_customer"
		, COUNT(CASE WHEN s.activity = 'paid_invoice' THEN s.ts END) AS "total_paid_invoices_ever"
		, MIN(CASE WHEN s.activity = 'attended_meeting' THEN s.ts END) AS "first_ever_attended_meeting_timestamp"
	FROM (
 		SELECT
			*
		FROM test_schema.activity_stream_paid_invoice AS s
		UNION ALL
			SELECT
		*
	FROM test_schema.activity_stream_attended_meeting AS s
) AS s
	GROUP BY s.customer
) AS ever
	ON c.join_customer = ever.join_customer
LEFT JOIN (
 	SELECT
		s.customer AS "join_customer"
		, c.join_cohort_id
		, MIN(CASE WHEN ( s.activity = 'purchased_product' AND s.feature_json ->> 'a1' = c.app_platform ) THEN s.ts END) AS "first_ever_purchased_product_timestamp"
		, MIN(CASE WHEN ( s.activity = 'purchased_product' AND s.feature_json ->> 'a1' = c.app_utm_campaign ) THEN s.ts END) AS "first_ever_purchased_product_timestamp_1"
	FROM (
 		SELECT
			s.activity_id
			, s.ts AS "timestamp"
			, s.customer
			, COALESCE(s.customer, s.anonymous_customer_id) AS "unique_identifier"
			, s.feature_json ->> 'a1' AS "ad_source"
			, s.feature_json ->> 'a2' AS "referring_domain"
			, s.feature_json ->> 'a3' AS "device"
			, s.link
			, ROW_NUMBER() over (PARTITION by COALESCE(s.customer, s.anonymous_customer_id) ORDER BY s.ts) AS "activity_occurrence"
			, enriched_pages_tbl.utm_campaign
			, customer_tbl.platform AS "app_platform"
			, s.utm_campaign AS "app_utm_campaign"
			, COALESCE(s.customer, s.anonymous_customer_id) AS "join_customer"
			, s.ts AS "join_ts"
			, s.activity_id AS "join_cohort_id"
			, LEAD(s.ts) over (PARTITION by COALESCE(s.customer, s.anonymous_customer_id) ORDER BY s.ts) AS "join_cohort_next_ts"
		FROM (
 			SELECT
				*
			FROM test_schema.activity_stream_started_session AS s
) AS s
		LEFT JOIN test_schema.customer AS customer_tbl
			ON s.customer = customer_tbl.customer
		LEFT JOIN test_schema.enriched_pages AS enriched_pages_tbl
			ON s.activity_id = enriched_pages_tbl.enriched_activity_id
		ORDER BY timestamp DESC
) AS c
	INNER JOIN (
 		SELECT
			*
		FROM test_schema.activity_stream_purchased_product AS s
) AS s
		ON s.customer = c.join_customer
	GROUP BY s.customer, c.join_cohort_id
) AS relative_ever
	ON (
		c.join_customer = relative_ever.join_customer  AND
		c.join_cohort_id = relative_ever.join_cohort_id
	)
ORDER BY timestamp DESC
