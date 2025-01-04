SELECT
	rd.month_of_timestamp AS "month_of_timestamp"
	, COUNT(1) AS "total_opened_email_rows"
	, SUM(rd.did_started_session_between) AS "total_started_session_between"
	, AVG(1.000 * rd.did_started_session_between) AS "conversion_rate_to_started_session_between"
	, AVG(1.000 * rd.days_to_started_session) AS "average_days_to_started_session"
	, SUM(rd.did_completed_order_between) AS "total_completed_order_between"
	, AVG(1.000 * rd.did_completed_order_between) AS "conversion_rate_to_completed_order_between"
	, AVG(1.000 * rd.days_to_completed_order) AS "average_days_to_completed_order"
FROM (
 	SELECT
		c.timestamp
		, in_between.first_in_between_started_session_timestamp
		, in_between.first_in_between_completed_order_timestamp
		, CASE WHEN first_in_between_started_session_timestamp is not NULL THEN 1 ELSE 0 END AS "did_started_session_between"
		, floor(EXTRACT(EPOCH FROM (first_in_between_started_session_timestamp - join_ts)) / 86400) AS "days_to_started_session"
		, CASE WHEN first_in_between_completed_order_timestamp is not NULL THEN 1 ELSE 0 END AS "did_completed_order_between"
		, floor(EXTRACT(EPOCH FROM (first_in_between_completed_order_timestamp - join_ts)) / 86400) AS "days_to_completed_order"
		, DATE_TRUNC('month', timestamp) AS "month_of_timestamp"
	FROM (
 		SELECT
			s.ts AS "timestamp"
			, s.customer AS "join_customer"
			, s.ts AS "join_ts"
			, s.activity_id AS "join_cohort_id"
			, LEAD(s.ts) over (PARTITION by s.customer ORDER BY s.ts) AS "join_cohort_next_ts"
		FROM (
 			SELECT
				*
			FROM test_schema.activity_stream_opened_email AS s
) AS s
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
					s.ts AS "timestamp"
					, s.customer AS "join_customer"
					, s.ts AS "join_ts"
					, s.activity_id AS "join_cohort_id"
					, LEAD(s.ts) over (PARTITION by s.customer ORDER BY s.ts) AS "join_cohort_next_ts"
				FROM (
 					SELECT
						*
					FROM test_schema.activity_stream_opened_email AS s
) AS s
) AS c
			INNER JOIN (
 				SELECT
					*
				FROM test_schema.activity_stream_started_session AS s
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
) AS rd
GROUP BY rd.month_of_timestamp
ORDER BY month_of_timestamp DESC
