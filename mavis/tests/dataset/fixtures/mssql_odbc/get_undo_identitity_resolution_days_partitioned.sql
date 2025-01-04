UPDATE test_schema.activity_stream_started_session
SET
	activity_occurrence = NULL ,
	customer = NULL
WHERE
	(
		activity_stream_started_session.anonymous_customer_id in (SELECT
	DISTINCT
	anonymous_customer_id
FROM test_schema.identity__activity_stream
WHERE (
	anonymous_customer_id is not NULL AND
	_activity_source = 'remove_internal_users'  AND
	CAST(ts AS DATE) > CAST('2022-11-13' AS DATE)
))  AND
		activity_stream_started_session.activity_id not in (SELECT
	DISTINCT
	activity_id
FROM test_schema.identity__activity_stream
WHERE (
	activity_id is not NULL AND
	_activity_source <> 'remove_internal_users'  AND
	CAST(ts AS DATE) <= CAST('2022-11-13' AS DATE)
))
	)
