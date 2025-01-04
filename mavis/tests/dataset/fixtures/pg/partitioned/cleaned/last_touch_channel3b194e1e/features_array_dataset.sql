SELECT
	*
	, total_started_pro_subscription_rows / NULLIF(SUM(total_started_pro_subscription_rows) OVER (), 0) AS "percent_of_started_session"
FROM (
	SELECT
		rd.last_touch_channel AS "last_touch_channel"
		, COUNT(1) AS "total_started_pro_subscription_rows"
		, SUM(rd.did_started_session_before) AS "total_started_session"
		, AVG(1.000 * rd.days_from_started_session) AS "average_days_from_started_session"
		, SUM(rd.did_email_link_clicked_before) AS "total_email_link_clicked"
		, AVG(1.000 * rd.did_email_link_clicked_before) AS "percent_of_email_link_clicked"
		, AVG(1.000 * rd.days_from_email_link_clicked) AS "average_days_from_email_link_clicked"
		, SUM(rd.did_payment_transactions_before) AS "total_payment_transactions"
		, AVG(1.000 * rd.did_payment_transactions_before) AS "percent_of_payment_transactions"
		, AVG(1.000 * rd.days_from_payment_transactions) AS "average_days_from_payment_transactions"
		, SUM(rd.last_before_payment_transactions_revenue_impact) AS "total_last_before_payment_transactions_revenue_impact"
	FROM (
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
				, CASE WHEN last_before_started_session_timestamp is not NULL THEN 1 ELSE 0 END AS "did_started_session_before"
				, floor(EXTRACT(EPOCH FROM (join_ts - last_before_started_session_timestamp)) / 86400) AS "days_from_started_session"
				, CASE WHEN last_before_email_link_clicked_timestamp is not NULL THEN 1 ELSE 0 END AS "did_email_link_clicked_before"
				, floor(EXTRACT(EPOCH FROM (join_ts - last_before_email_link_clicked_timestamp)) / 86400) AS "days_from_email_link_clicked"
				, CASE WHEN last_before_payment_transactions_timestamp is not NULL THEN 1 ELSE 0 END AS "did_payment_transactions_before"
				, floor(EXTRACT(EPOCH FROM (join_ts - last_before_payment_transactions_timestamp)) / 86400) AS "days_from_payment_transactions"
			FROM (
 				SELECT
					*
				FROM (
					SELECT
						s.ts AS "timestamp"
						, s.customer AS "join_customer"
						, s.ts AS "join_ts"
						, s.activity_id AS "join_cohort_id"
					FROM (
 						SELECT
							*
						FROM test_schema.activity_stream_started_pro_subscription AS s
						WHERE s.ts >= CAST('2022-01-01T05:00:00.000Z' AS TIMESTAMP)
) AS s
				) AS c
				WHERE c.timestamp >= CAST('2022-01-01T05:00:00.000Z' AS TIMESTAMP)
) AS c
			LEFT JOIN (
 				SELECT
					s.*
					, enrichment_table_tbl.utm_source_channel_grouping AS "last_touch_channel"
				FROM (
					SELECT
						join_customer
						, join_cohort_id
						, MAX(last_before_started_session_timestamp) AS "last_before_started_session_timestamp"
						, NULLIF(SUBSTRING(MAX(CONCAT(DATE_TRUNC('second', s.last_before_started_session_timestamp), COALESCE(join_enriched_activity_id_0_a,''))),20, 1000),'') AS "join_enriched_activity_id_0_a"
						, MAX(last_before_email_link_clicked_timestamp) AS "last_before_email_link_clicked_timestamp"
						, MAX(last_before_payment_transactions_timestamp) AS "last_before_payment_transactions_timestamp"
						, MAX(last_before_payment_transactions_revenue_impact) AS "last_before_payment_transactions_revenue_impact"
						, NULLIF(SUBSTRING(MAX(CONCAT(DATE_TRUNC('second', s.last_before_payment_transactions_timestamp), COALESCE(last_before_purchase_description_frequency,''))),20, 1000),'') AS "last_before_purchase_description_frequency"
					FROM (
						SELECT
							s.customer AS "join_customer"
							, c.join_cohort_id
							, s.ts
							, CASE WHEN ( s.activity = 'started_session' AND ABS(floor(EXTRACT(EPOCH FROM (c.join_ts - s.ts)) / 86400)) < 30 ) THEN s.ts END AS "last_before_started_session_timestamp"
							, CASE WHEN ( s.activity = 'started_session' AND ABS(floor(EXTRACT(EPOCH FROM (c.join_ts - s.ts)) / 86400)) < 30 ) THEN s.activity_id END AS "join_enriched_activity_id_0_a"
							, CASE WHEN ( s.activity = 'clicked_email_link' AND ( s.feature_json ->> 'a2' not ilike '%password reset%' OR s.feature_json ->> 'a2' not ilike '%validation%' ) AND ABS(floor(EXTRACT(EPOCH FROM (c.join_ts - s.ts)) / 86400)) < 30 ) THEN s.ts END AS "last_before_email_link_clicked_timestamp"
							, CASE WHEN s.activity = 'payment' THEN s.ts END AS "last_before_payment_transactions_timestamp"
							, CASE WHEN ( s.activity = 'payment' AND ROW_NUMBER() over (PARTITION by s.activity, s.customer, c.join_cohort_id ORDER BY s.ts desc) = 1 ) THEN s.revenue_impact END AS "last_before_payment_transactions_revenue_impact"
							, CASE WHEN s.activity = 'payment' THEN s.feature_json ->> 'a1' END AS "last_before_purchase_description_frequency"
						FROM (
 							SELECT
								*
							FROM (
								SELECT
									s.ts AS "timestamp"
									, s.customer AS "join_customer"
									, s.ts AS "join_ts"
									, s.activity_id AS "join_cohort_id"
								FROM (
 									SELECT
										*
									FROM test_schema.activity_stream_started_pro_subscription AS s
									WHERE s.ts >= CAST('2022-01-01T05:00:00.000Z' AS TIMESTAMP)
) AS s
							) AS c
							WHERE c.timestamp >= CAST('2022-01-01T05:00:00.000Z' AS TIMESTAMP)
) AS c
						INNER JOIN (
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
) AS s
							ON (
								s.customer = c.join_customer  AND
								s.ts < c.join_ts
							)
					) AS s
					GROUP BY join_customer, join_cohort_id
				) AS s
				LEFT JOIN test_schema.enrichment_table AS enrichment_table_tbl
					ON s.join_enriched_activity_id_0_a = enrichment_table_tbl.enriched_activity_id
) AS before
				ON (
					c.join_customer = before.join_customer  AND
					c.join_cohort_id = before.join_cohort_id
				)
		) AS sub_query
		WHERE (
			did_email_link_clicked_before = 1.0  AND
			last_before_purchase_description_frequency not ilike '%recurring%'
		)
) AS rd
	GROUP BY rd.last_touch_channel
) AS sub_query
ORDER BY total_started_pro_subscription_rows DESC
