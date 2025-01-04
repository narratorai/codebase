SELECT
	*
	, total_opened_email / NULLIF(SUM(total_opened_email) OVER (), 0) AS "percent_of_total_opened_email"
FROM (
	SELECT
		rd.grouped_campaign_type AS "grouped_campaign_type"
		, COUNT(1) AS "total_opened_email"
		, AVG(1.000 * rd.did_completed_order_between) AS "conversion_rate_to_completed_order_between"
		, SUM(rd.did_completed_order_between) AS "total_did_completed_order_between"
		, STDDEV(rd.did_completed_order_between) AS "stddev_did_completed_order_between"
	FROM (
 		SELECT
			*
		FROM (
			SELECT
				*
				, FLOOR(did_completed_order_between/0.01) * 0.01 AS "rounded_did_completed_order_between"
			FROM (
				SELECT
					c.activity_id
					, c.timestamp
					, c.customer
					, c.campaign_type
					, c.activity_occurrence
					, in_between.first_in_between_started_session_timestamp
					, in_between.first_in_between_completed_order_timestamp
					, CASE WHEN first_in_between_started_session_timestamp is not NULL THEN 1 ELSE 0 END AS "did_started_session_between"
					, floor(EXTRACT(EPOCH FROM (first_in_between_started_session_timestamp - join_ts)) / 86400) AS "days_to_started_session"
					, CASE WHEN first_in_between_completed_order_timestamp is not NULL THEN 1 ELSE 0 END AS "did_completed_order_between"
					, floor(EXTRACT(EPOCH FROM (first_in_between_completed_order_timestamp - join_ts)) / 86400) AS "days_to_completed_order"
					, DATE_TRUNC('month', timestamp) AS "month"
					, DATE_TRUNC('month', timestamp) AS "month_1"
					, CASE WHEN campaign_type = 'MISSING YOU' THEN 'MISSING YOU' ELSE 'Not MISSING YOU' END AS "grouped_campaign_type"
				FROM (
 					SELECT
						*
					FROM (
						SELECT
							s.activity_id
							, s.ts AS "timestamp"
							, s.customer
							, s.feature_json ->> 'a1' AS "campaign_type"
							, ROW_NUMBER() over (PARTITION by s.customer ORDER BY s.ts) AS "activity_occurrence"
							, s.customer AS "join_customer"
							, s.ts AS "join_ts"
							, s.activity_id AS "join_cohort_id"
							, LEAD(s.ts) over (PARTITION by s.customer ORDER BY s.ts) AS "join_cohort_next_ts"
						FROM (
 							SELECT
								*
							FROM test_schema.activity_stream AS s
							WHERE (
								s.activity = 'opened_email'  AND
								CAST(s.ts AS DATE) >= CAST('2018-01-01' AS DATE)
							)
) AS s
					) AS c
					WHERE (
						CAST(c.timestamp AS DATE) < CAST('2022-04-13' AS DATE)  AND
						CAST(c.timestamp AS DATE) >= CAST('2018-01-01' AS DATE)
					)
) AS c
				LEFT JOIN (
 					SELECT
						join_customer
						, join_cohort_id
						, MIN(first_in_between_started_session_timestamp) AS "first_in_between_started_session_timestamp"
						, MIN(first_in_between_completed_order_timestamp) AS "first_in_between_completed_order_timestamp"
					FROM (
						SELECT
							s.customer AS "join_customer"
							, c.join_cohort_id
							, s.ts
							, CASE WHEN s.activity = 'started_session' THEN s.ts END AS "first_in_between_started_session_timestamp"
							, CASE WHEN s.activity = 'completed_order' THEN s.ts END AS "first_in_between_completed_order_timestamp"
						FROM (
 							SELECT
								*
							FROM (
								SELECT
									s.activity_id
									, s.ts AS "timestamp"
									, s.customer
									, s.feature_json ->> 'a1' AS "campaign_type"
									, ROW_NUMBER() over (PARTITION by s.customer ORDER BY s.ts) AS "activity_occurrence"
									, s.customer AS "join_customer"
									, s.ts AS "join_ts"
									, s.activity_id AS "join_cohort_id"
									, LEAD(s.ts) over (PARTITION by s.customer ORDER BY s.ts) AS "join_cohort_next_ts"
								FROM (
 									SELECT
										*
									FROM test_schema.activity_stream AS s
									WHERE (
										s.activity = 'opened_email'  AND
										CAST(s.ts AS DATE) >= CAST('2018-01-01' AS DATE)
									)
) AS s
							) AS c
							WHERE (
								CAST(c.timestamp AS DATE) < CAST('2022-04-13' AS DATE)  AND
								CAST(c.timestamp AS DATE) >= CAST('2018-01-01' AS DATE)
							)
) AS c
						INNER JOIN (
 							SELECT
								*
							FROM test_schema.activity_stream AS s
							WHERE (
								s.activity in ('completed_order', 'started_session')  AND
								CAST(s.ts AS DATE) >= CAST('2018-01-01' AS DATE)
							)
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
			) AS sub_query
		) AS sub_query
		WHERE did_completed_order_between is not NULL
) AS rd
	GROUP BY rd.grouped_campaign_type
) AS sub_query
ORDER BY total_opened_email DESC
