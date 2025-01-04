WITH
cohort_stream AS (
	SELECT
		*
	FROM test_schema.activity_stream_started_session AS s
),
in_between_stream AS (
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
),
before_stream AS (
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
),
ever_stream AS (
	SELECT
		*
	FROM test_schema.activity_stream_paid_invoice AS s
	UNION ALL
		SELECT
		*
	FROM test_schema.activity_stream_attended_meeting AS s
),
relative_ever_stream AS (
	SELECT
		*
	FROM test_schema.activity_stream_purchased_product AS s
),
cohort AS (
	SELECT
		s.ts AS "timestamp"
		, customer_tbl.platform AS "app_platform"
		, s.utm_campaign AS "app_utm_campaign"
		, COALESCE(s.customer, s.anonymous_customer_id) AS "join_customer"
		, s.ts AS "join_ts"
		, s.activity_id AS "join_cohort_id"
		, LEAD(s.ts) over (PARTITION by COALESCE(s.customer, s.anonymous_customer_id) ORDER BY s.ts) AS "join_cohort_next_ts"
	FROM cohort_stream AS s
	LEFT JOIN test_schema.customer AS customer_tbl
		ON s.customer = customer_tbl.customer
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
			, CASE WHEN ( s.activity = 'solved_ticket' AND s.ts < COALESCE(MAX(CASE WHEN s.activity = 'paid_invoice' THEN s.ts END) over (PARTITION by s.customer, c.join_cohort_id), CAST('2100-01-01' AS DATE)) ) THEN s.ts END AS "first_in_between_solved_ticket_timestamp"
		FROM cohort AS c
		INNER JOIN in_between_stream AS s
			ON (
				s.customer = c.join_customer  AND
				s.ts > c.join_ts  AND
				s.ts <= COALESCE(c.join_cohort_next_ts, CAST('2100-01-01' AS DATE))
			)
	) AS s
	GROUP BY join_customer, join_cohort_id
),
append_before AS (
	SELECT
		s.customer AS "join_customer"
		, c.join_cohort_id
		, MAX(CASE WHEN ( s.activity = 'paid_invoice' AND ABS(FLOOR(DATEDIFF(second, s.ts, c.join_ts)/86400)) < 30 ) THEN s.ts END) AS "last_before_paid_invoice_timestamp"
		, MAX(CASE WHEN ( s.activity = 'attended_meeting' AND ABS(FLOOR(DATEDIFF(second, s.ts, c.join_ts)/86400)) < 20 ) THEN s.ts END) AS "last_before_attended_meeting_timestamp"
		, COUNT(CASE WHEN ( s.activity = 'viewed_paywall' AND ABS(FLOOR(DATEDIFF(second, s.ts, c.join_ts)/60)) < 30 ) THEN s.ts END) AS "total_viewed_paywalls_before"
	FROM cohort AS c
	INNER JOIN before_stream AS s
		ON (
			s.customer = c.join_customer  AND
			ABS(FLOOR(DATEDIFF(second, s.ts, c.join_ts)/86400)) < 30  AND
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
		, MIN(CASE WHEN ( s.activity = 'purchased_product' AND JSON_VALUE(s.feature_json, '$.a1') = c.app_platform ) THEN s.ts END) AS "first_ever_purchased_product_timestamp"
		, MIN(CASE WHEN ( s.activity = 'purchased_product' AND JSON_VALUE(s.feature_json, '$.a1') = c.app_utm_campaign ) THEN s.ts END) AS "first_ever_purchased_product_timestamp_1"
	FROM cohort AS c
	INNER JOIN relative_ever_stream AS s
		ON s.customer = c.join_customer
	GROUP BY s.customer, c.join_cohort_id
),
raw_dataset AS (
	SELECT
		c.timestamp
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
		, FLOOR(DATEDIFF(second, join_ts, first_in_between_completed_order_timestamp)/86400) AS "days_to_completed_order"
		, CASE WHEN last_before_paid_invoice_timestamp is not NULL THEN 1 ELSE 0 END AS "did_paid_invoice_before"
		, FLOOR(DATEDIFF(second, last_before_paid_invoice_timestamp, join_ts)/86400) AS "days_from_paid_invoice"
		, CASE WHEN last_before_attended_meeting_timestamp is not NULL THEN 1 ELSE 0 END AS "did_attended_meeting_before"
		, FLOOR(DATEDIFF(second, last_before_attended_meeting_timestamp, join_ts)/86400) AS "days_from_attended_meeting"
		, CASE WHEN first_ever_purchased_product_timestamp is not NULL THEN 1 ELSE 0 END AS "did_purchased_product_ever"
		, FLOOR(DATEDIFF(second, first_ever_purchased_product_timestamp, join_ts)/86400) AS "days_from_purchased_product"
		, CASE WHEN first_ever_purchased_product_timestamp_1 is not NULL THEN 1 ELSE 0 END AS "did_purchased_product_ever_1"
		, FLOOR(DATEDIFF(second, first_ever_purchased_product_timestamp_1, join_ts)/86400) AS "days_from_purchased_product_1"
		, CASE WHEN first_in_between_solved_ticket_timestamp is not NULL THEN 1 ELSE 0 END AS "did_solved_ticket_between"
		, FLOOR(DATEDIFF(second, join_ts, first_in_between_solved_ticket_timestamp)/86400) AS "days_to_solved_ticket"
		, CASE WHEN first_ever_attended_meeting_timestamp is not NULL THEN 1 ELSE 0 END AS "did_attended_meeting_ever"
		, FLOOR(DATEDIFF(second, first_ever_attended_meeting_timestamp, join_ts)/86400) AS "days_from_attended_meeting_1"
		, DATEADD(month, datediff(month, 0, timestamp), 0) AS "month_of_timestamp"
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
)
SELECT
	rd.month_of_timestamp AS "month_of_timestamp"
	, COUNT(1) AS "total_started_session_rows"
	, SUM(rd.did_completed_order_between) AS "total_completed_order_between"
	, AVG(1.000 * rd.did_completed_order_between) AS "conversion_rate_to_completed_order_between"
	, AVG(1.000 * rd.days_to_completed_order) AS "average_days_to_completed_order"
	, SUM(rd.did_paid_invoice_before) AS "total_paid_invoice"
	, AVG(1.000 * rd.did_paid_invoice_before) AS "percent_of_paid_invoice"
	, AVG(1.000 * rd.days_from_paid_invoice) AS "average_days_from_paid_invoice"
	, SUM(rd.did_attended_meeting_before) AS "total_attended_meeting"
	, AVG(1.000 * rd.did_attended_meeting_before) AS "percent_of_attended_meeting"
	, AVG(1.000 * rd.days_from_attended_meeting) AS "average_days_from_attended_meeting"
	, SUM(rd.total_paid_invoices_ever) AS "total_paid_invoices_ever"
	, AVG(1.000 * rd.total_paid_invoices_ever) AS "average_total_paid_invoices_ever"
	, SUM(rd.did_purchased_product_ever) AS "total_purchased_product_ever"
	, AVG(1.000 * rd.did_purchased_product_ever) AS "conversion_rate_to_purchased_product_ever"
	, AVG(1.000 * rd.days_from_purchased_product) AS "average_days_from_purchased_product"
	, SUM(rd.did_purchased_product_ever_1) AS "total_purchased_product_ever_1"
	, AVG(1.000 * rd.did_purchased_product_ever_1) AS "conversion_rate_to_purchased_product_ever_1"
	, AVG(1.000 * rd.days_from_purchased_product_1) AS "average_days_from_purchased_product_1"
	, SUM(rd.did_solved_ticket_between) AS "total_solved_ticket_between"
	, AVG(1.000 * rd.did_solved_ticket_between) AS "conversion_rate_to_solved_ticket_between"
	, AVG(1.000 * rd.days_to_solved_ticket) AS "average_days_to_solved_ticket"
	, SUM(rd.total_viewed_paywalls_before) AS "total_viewed_paywalls_before"
	, AVG(1.000 * rd.total_viewed_paywalls_before) AS "average_total_viewed_paywalls_before"
	, SUM(rd.did_attended_meeting_ever) AS "total_attended_meeting_ever"
	, AVG(1.000 * rd.did_attended_meeting_ever) AS "conversion_rate_to_attended_meeting_ever"
	, AVG(1.000 * rd.days_from_attended_meeting_1) AS "average_days_from_attended_meeting_1"
FROM raw_dataset AS rd
GROUP BY rd.month_of_timestamp
ORDER BY month_of_timestamp DESC
