MERGE INTO test_schema.stg__activity_stream AS u
USING (
	SELECT
		*
	FROM (
		SELECT
			a.anonymous_customer_id
			, a.customer
			, ROW_NUMBER() over (PARTITION by a.anonymous_customer_id ORDER BY a.ts desc) AS rw
		FROM test_schema.identity__activity_stream AS a
		WHERE a._activity_source = 'alias_slug'
	)
	WHERE rw = 1
) AS a
ON 	(
		u.customer = LOWER(CASE WHEN a.anonymous_customer_id in ('None', 'none', '', ' ', 'null', 'NULL', 'nil') THEN NULL ELSE a.anonymous_customer_id END)  AND
		u.customer <> a.customer
	)
WHEN MATCHED THEN UPDATE SET
	u.customer = a.customer ,
	u.activity_occurrence = NULL
