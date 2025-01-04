(
	SELECT
		*
	FROM test_schema.activity_stream_slug_pt
	UNION ALL
		SELECT
		*
	FROM test_schema.activity_stream_test
) AS sub_query
