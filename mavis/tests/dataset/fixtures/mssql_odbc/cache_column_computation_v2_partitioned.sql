UPDATE test_schema.activity_stream_started_session
SET
	activity_occurrence = s.new_activity_occurrence ,
	activity_repeated_at = s.new_activity_repeated_at
FROM (
	SELECT
		*
	FROM (
		SELECT
			s.activity_id
			, s.activity
			, s.ts
			, s.activity_occurrence
			, s.activity_repeated_at
			, LEAD(s.ts) over (PARTITION by s.activity, COALESCE(s.customer, s.anonymous_customer_id) ORDER BY s.ts) AS "new_activity_repeated_at"
			, ROW_NUMBER() over (PARTITION by s.activity, COALESCE(s.customer, s.anonymous_customer_id) ORDER BY s.ts) AS "new_activity_occurrence"
		FROM test_schema.activity_stream_started_session AS s
		WHERE COALESCE(s.customer, s.anonymous_customer_id) in (SELECT
	DISTINCT
	COALESCE(customer, anonymous_customer_id) AS "person"
FROM test_schema.stg__activity_stream  )
	) AS sub_query
	WHERE (
		activity_occurrence is NULL OR
		COALESCE(activity_occurrence, 0) <> new_activity_occurrence  OR
		COALESCE(activity_repeated_at, CAST('1900-01-01T01:00:00' AS DATETIME)) <> new_activity_repeated_at
	)
) AS s
WHERE
	activity_stream_started_session.activity_id = s.activity_id
