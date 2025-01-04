UPDATE test_schema.activity_stream
SET
	activity_occurrence = NULL ,
	customer = NULL
WHERE
	(
		activity_stream.anonymous_customer_id in (SELECT
	DISTINCT
	anonymous_customer_id
FROM test_schema.identity__activity_stream
WHERE (
	anonymous_customer_id is not NULL AND
	_activity_source = 'remove_internal_users'
))  AND
		activity_stream.activity_id not in (SELECT
	DISTINCT
	activity_id
FROM test_schema.identity__activity_stream
WHERE (
	activity_id is not NULL AND
	_activity_source <> 'remove_internal_users'
)) AND
		activity_stream.activity = 'started_session'
	)
