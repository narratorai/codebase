SELECT
	c.activity_id
	, c.timestamp
	, c.customer
	, c.unique_identifier
	, c.activity
	, c.description
	, c.account_type
	, c.name
	, c.revenue_impact
	, c.link
	, c.fivetran_synced
	, c.balance
	, c.billing_address_id
	, in_between.next_money_raiseds_timestamp
	, CASE WHEN next_money_raiseds_timestamp is not NULL THEN 1 ELSE 0 END AS "did_repeat_money_raised"
FROM (
 	SELECT
		s.activity_id
		, s.ts AS "timestamp"
		, s.customer
		, COALESCE(s.customer, s.anonymous_customer_id) AS "unique_identifier"
		, s.activity
		, s.feature_json ->> 'a1' AS "description"
		, s.feature_json ->> 'a2' AS "account_type"
		, s.feature_json ->> 'a3' AS "name"
		, s.revenue_impact
		, s.link
		, events_tbl._fivetran_synced AS "fivetran_synced"
		, events_tbl.event_type AS "app_event_type"
		, vendor_tbl.balance
		, vendor_tbl.billing_address_id
		, COALESCE(s.customer, s.anonymous_customer_id) AS "join_customer"
		, s.ts AS "join_ts"
		, s.activity_id AS "join_cohort_id"
		, LEAD(s.ts) over (PARTITION by COALESCE(s.customer, s.anonymous_customer_id) ORDER BY s.ts) AS "join_cohort_next_ts"
	FROM (
 		SELECT
			*
		FROM test_schema.activity_stream_money_raised AS s
) AS s
	LEFT JOIN calendly.events AS events_tbl
		ON s.activity_id = events_tbl._id
	LEFT JOIN quickbooks.vendor AS vendor_tbl
		ON s.customer = vendor_tbl.id
	WHERE events_tbl.event_type ilike '%hi%'
	ORDER BY timestamp DESC
) AS c
LEFT JOIN (
 	SELECT
		join_customer
		, join_cohort_id
		, MIN(next_money_raiseds_timestamp) AS "next_money_raiseds_timestamp"
	FROM (
		SELECT
			COALESCE(s.customer, s.anonymous_customer_id) AS "join_customer"
			, c.join_cohort_id
			, s.ts
			, CASE WHEN ( s.activity = 'money_raised' AND events_tbl.tracking ilike '%k%' AND events_tbl.questions_and_responses = c.app_event_type ) THEN s.ts END AS "next_money_raiseds_timestamp"
		FROM (
 			SELECT
				s.activity_id
				, s.ts AS "timestamp"
				, s.customer
				, COALESCE(s.customer, s.anonymous_customer_id) AS "unique_identifier"
				, s.activity
				, s.feature_json ->> 'a1' AS "description"
				, s.feature_json ->> 'a2' AS "account_type"
				, s.feature_json ->> 'a3' AS "name"
				, s.revenue_impact
				, s.link
				, events_tbl._fivetran_synced AS "fivetran_synced"
				, events_tbl.event_type AS "app_event_type"
				, vendor_tbl.balance
				, vendor_tbl.billing_address_id
				, COALESCE(s.customer, s.anonymous_customer_id) AS "join_customer"
				, s.ts AS "join_ts"
				, s.activity_id AS "join_cohort_id"
				, LEAD(s.ts) over (PARTITION by COALESCE(s.customer, s.anonymous_customer_id) ORDER BY s.ts) AS "join_cohort_next_ts"
			FROM (
 				SELECT
					*
				FROM test_schema.activity_stream_money_raised AS s
) AS s
			LEFT JOIN calendly.events AS events_tbl
				ON s.activity_id = events_tbl._id
			LEFT JOIN quickbooks.vendor AS vendor_tbl
				ON s.customer = vendor_tbl.id
			WHERE events_tbl.event_type ilike '%hi%'
			ORDER BY timestamp DESC
) AS c
		INNER JOIN (
 			SELECT
				*
			FROM test_schema.activity_stream_money_raised AS s
) AS s
			ON (
				COALESCE(s.customer, s.anonymous_customer_id) = c.join_customer  AND
				s.ts > c.join_ts  AND
				s.ts <= COALESCE(c.join_cohort_next_ts, CAST('2100-01-01' AS DATE))
			)
		LEFT JOIN calendly.events AS events_tbl
			ON s.activity_id = events_tbl._id
	) AS s
	GROUP BY join_customer, join_cohort_id
) AS in_between
	ON (
		c.join_customer = in_between.join_customer  AND
		c.join_cohort_id = in_between.join_cohort_id
	)
ORDER BY timestamp DESC
