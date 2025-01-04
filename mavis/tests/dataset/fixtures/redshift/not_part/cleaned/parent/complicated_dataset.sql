WITH
cohort_stream AS (
	SELECT
		*
	FROM test_schema.activity_stream AS s
	WHERE s.activity = 'started_session'
),
in_between_stream AS (
	SELECT
		*
	FROM test_schema.activity_stream AS s
	WHERE s.activity in ('completed_order', 'paid_invoice', 'solved_ticket')
),
before_stream AS (
	SELECT
		*
	FROM test_schema.activity_stream AS s
	WHERE s.activity in ('attended_meeting', 'paid_invoice', 'viewed_paywall')
),
ever_stream AS (
	SELECT
		*
	FROM test_schema.activity_stream AS s
	WHERE s.activity in ('attended_meeting', 'paid_invoice')
),
relative_ever_stream AS (
	SELECT
		*
	FROM test_schema.activity_stream AS s
	WHERE s.activity = 'purchased_product'
),
cohort AS (
	SELECT
		s.activity_id
		, s.ts AS "timestamp"
		, s.customer
		, NVL(s.customer, s.anonymous_customer_id) AS "unique_identifier"
		, CAST(s.feature_json."a1" AS VARCHAR(4096)) AS "ad_source"
		, CAST(s.feature_json."a2" AS VARCHAR(4096)) AS "referring_domain"
		, CAST(s.feature_json."a3" AS VARCHAR(4096)) AS "device"
		, s.link
		, ROW_NUMBER() over (PARTITION by NVL(s.customer, s.anonymous_customer_id) ORDER BY s.ts) AS "activity_occurrence"
		, enriched_pages_tbl.utm_campaign
		, customer_tbl.platform AS "app_platform"
		, s.utm_campaign AS "app_utm_campaign"
		, NVL(s.customer, s.anonymous_customer_id) AS "join_customer"
		, s.ts AS "join_ts"
		, s.activity_id AS "join_cohort_id"
		, LEAD(s.ts) over (PARTITION by NVL(s.customer, s.anonymous_customer_id) ORDER BY s.ts) AS "join_cohort_next_ts"
	FROM cohort_stream AS s
	LEFT JOIN test_schema.customer AS customer_tbl
		ON s.customer = customer_tbl.customer
	LEFT JOIN test_schema.enriched_pages AS enriched_pages_tbl
		ON s.activity_id = enriched_pages_tbl.enriched_activity_id
	ORDER BY "timestamp" DESC
),
append_in_between AS (
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
			, CASE WHEN ( s.activity = 'solved_ticket' AND s.ts < NVL(MAX(CASE WHEN s.activity = 'paid_invoice' THEN s.ts END) over (PARTITION by s.customer, c.join_cohort_id), CAST('2100-01-01' AS DATE)) ) THEN s.ts END AS "first_in_between_solved_ticket_timestamp"
		FROM cohort AS c
		INNER JOIN in_between_stream AS s
			ON (
				s.customer = c.join_customer  AND
				s.ts > c.join_ts  AND
				s.ts <= NVL(c.join_cohort_next_ts, CAST('2100-01-01' AS DATE))
			)
	) AS s
	GROUP BY join_customer, join_cohort_id
),
append_before AS (
	SELECT
		s.customer AS "join_customer"
		, c.join_cohort_id
		, MAX(CASE WHEN ( s.activity = 'paid_invoice' AND ABS(FLOOR(DATE_DIFF('second', s.ts, c.join_ts)/86400)) < 30 ) THEN s.ts END) AS "last_before_paid_invoice_timestamp"
		, MAX(CASE WHEN ( s.activity = 'attended_meeting' AND ABS(FLOOR(DATE_DIFF('second', s.ts, c.join_ts)/86400)) < 20 ) THEN s.ts END) AS "last_before_attended_meeting_timestamp"
		, COUNT(CASE WHEN ( s.activity = 'viewed_paywall' AND ABS(FLOOR(DATE_DIFF('second', s.ts, c.join_ts)/60)) < 30 ) THEN s.ts END) AS "total_viewed_paywalls_before"
	FROM cohort AS c
	INNER JOIN before_stream AS s
		ON (
			s.customer = c.join_customer  AND
			ABS(FLOOR(DATE_DIFF('second', s.ts, c.join_ts)/86400)) < 30  AND
			s.ts < c.join_ts
		)
	GROUP BY s.customer, c.join_cohort_id
),
append_ever AS (
	SELECT
		s.customer AS "join_customer"
		, COUNT(CASE WHEN s.activity = 'paid_invoice' THEN s.ts END) AS "total_paid_invoices_ever"
		, MIN(CASE WHEN s.activity = 'attended_meeting' THEN s.ts END) AS "first_ever_attended_meeting_timestamp"
	FROM ever_stream AS s
	GROUP BY s.customer
),
append_relative_ever AS (
	SELECT
		s.customer AS "join_customer"
		, c.join_cohort_id
		, MIN(CASE WHEN ( s.activity = 'purchased_product' AND CAST(s.feature_json."a1" AS VARCHAR(4096)) = c.app_platform ) THEN s.ts END) AS "first_ever_purchased_product_timestamp"
		, MIN(CASE WHEN ( s.activity = 'purchased_product' AND CAST(s.feature_json."a1" AS VARCHAR(4096)) = c.app_utm_campaign ) THEN s.ts END) AS "first_ever_purchased_product_timestamp_1"
	FROM cohort AS c
	INNER JOIN relative_ever_stream AS s
		ON s.customer = c.join_customer
	GROUP BY s.customer, c.join_cohort_id
)
SELECT
	c.activity_id
	, c."timestamp"
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
	, NVL(before.total_viewed_paywalls_before, 0) AS "total_viewed_paywalls_before"
	, NVL(ever.total_paid_invoices_ever, 0) AS "total_paid_invoices_ever"
	, ever.first_ever_attended_meeting_timestamp
	, relative_ever.first_ever_purchased_product_timestamp
	, relative_ever.first_ever_purchased_product_timestamp_1
	, CASE WHEN first_in_between_completed_order_timestamp is not NULL THEN 1 ELSE 0 END AS "did_completed_order_between"
	, FLOOR(DATE_DIFF('second', join_ts, first_in_between_completed_order_timestamp)/86400) AS "days_to_completed_order"
	, CASE WHEN last_before_paid_invoice_timestamp is not NULL THEN 1 ELSE 0 END AS "did_paid_invoice_before"
	, FLOOR(DATE_DIFF('second', last_before_paid_invoice_timestamp, join_ts)/86400) AS "days_from_paid_invoice"
	, CASE WHEN last_before_attended_meeting_timestamp is not NULL THEN 1 ELSE 0 END AS "did_attended_meeting_before"
	, FLOOR(DATE_DIFF('second', last_before_attended_meeting_timestamp, join_ts)/86400) AS "days_from_attended_meeting"
	, CASE WHEN first_ever_purchased_product_timestamp is not NULL THEN 1 ELSE 0 END AS "did_purchased_product_ever"
	, FLOOR(DATE_DIFF('second', first_ever_purchased_product_timestamp, join_ts)/86400) AS "days_from_purchased_product"
	, CASE WHEN first_ever_purchased_product_timestamp_1 is not NULL THEN 1 ELSE 0 END AS "did_purchased_product_ever_1"
	, FLOOR(DATE_DIFF('second', first_ever_purchased_product_timestamp_1, join_ts)/86400) AS "days_from_purchased_product_1"
	, CASE WHEN first_in_between_solved_ticket_timestamp is not NULL THEN 1 ELSE 0 END AS "did_solved_ticket_between"
	, FLOOR(DATE_DIFF('second', join_ts, first_in_between_solved_ticket_timestamp)/86400) AS "days_to_solved_ticket"
	, CASE WHEN first_ever_attended_meeting_timestamp is not NULL THEN 1 ELSE 0 END AS "did_attended_meeting_ever"
	, FLOOR(DATE_DIFF('second', first_ever_attended_meeting_timestamp, join_ts)/86400) AS "days_from_attended_meeting_1"
	, DATE_TRUNC('month', "timestamp") AS "month_of_timestamp"
FROM cohort AS c
LEFT JOIN append_in_between AS in_between
	ON (
		c.join_customer = in_between.join_customer  AND
		c.join_cohort_id = in_between.join_cohort_id
	)
LEFT JOIN append_before AS before
	ON (
		c.join_customer = before.join_customer  AND
		c.join_cohort_id = before.join_cohort_id
	)
LEFT JOIN append_ever AS ever
	ON c.join_customer = ever.join_customer
LEFT JOIN append_relative_ever AS relative_ever
	ON (
		c.join_customer = relative_ever.join_customer  AND
		c.join_cohort_id = relative_ever.join_cohort_id
	)
ORDER BY "timestamp" DESC
