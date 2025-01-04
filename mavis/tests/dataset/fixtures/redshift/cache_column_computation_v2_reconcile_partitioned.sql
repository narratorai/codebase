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
			, LEAD(s.ts) over (PARTITION by s.activity, NVL(s.customer, s.anonymous_customer_id) ORDER BY s.ts) AS "new_activity_repeated_at"
			, ROW_NUMBER() over (PARTITION by s.activity, NVL(s.customer, s.anonymous_customer_id) ORDER BY s.ts) AS "new_activity_occurrence"
		FROM test_schema.activity_stream_started_session AS s
		WHERE NVL(s.customer, s.anonymous_customer_id) in (SELECT
	DISTINCT
	NVL(customer, anonymous_customer_id) AS "person"
FROM test_schema.activity_stream_started_session
WHERE activity_occurrence is NULL)
	)
	WHERE (
		activity_occurrence is NULL OR
		NVL(activity_occurrence, 0) <> new_activity_occurrence  OR
		NVL(activity_repeated_at, CAST('1900-01-01T01:00:00' AS TIMESTAMP)) <> new_activity_repeated_at
	)
) AS s
WHERE
	activity_stream_started_session.activity_id = s.activity_id
