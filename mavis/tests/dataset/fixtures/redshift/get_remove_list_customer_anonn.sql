 INSERT INTO test_schema.stg__activity_stream
  ("activity", "activity_id", "customer", "link", "revenue_impact", "anonymous_customer_id", "ts", "_run_at", "_activity_source", "feature_json")
 (SELECT
	s.*
FROM (
	SELECT
		s.activity
		, s.activity_id
		, LOWER(CASE WHEN s.customer in ('None', 'none', '', ' ', 'null', 'NULL', 'nil') THEN NULL ELSE s.customer END) AS "customer"
		, s.link
		, CAST(s.revenue_impact AS FLOAT) AS "revenue_impact"
		, CASE WHEN CONCAT(s.source, s.source_id) in ('None', 'none', '', ' ', 'null', 'NULL', 'nil') THEN NULL ELSE CONCAT(s.source, s.source_id) END AS "anonymous_customer_id"
		, s.ts
		, SYSDATE AS "_run_at"
		, 'started_sessions' AS "_activity_source"
		, object('a1', s.feature_1, 'a2', s.feature_2, 'a3', s.feature_3) AS "feature_json"
	FROM (
		SELECT
		    t.message_id || t.timestamp AS activity_id,
		    t.timestamp AS ts,


		    NULL AS source,
		    NULL AS source_id,
		    mt.company_slug AS customer,


		    'ran_dataset' AS activity,


		    mt.dataset_slug AS feature_1,
		    mt.group_slug AS feature_2,
		    t.user_id AS feature_3,


		    NULL AS revenue_impact,
		    t.context_page_url AS link

		FROM portal.tracks t
		join portal.ran_dataset mt
		    on (mt.message_id = t.message_id)
		where t.event = 'ran_dataset'
		    and mt.company_slug is not NULL

		 limit 100000000
	) AS s
) AS s
WHERE (
	CAST(s.ts AS DATE) < CAST('2022-01-01' AS DATE)  AND
	s.anonymous_customer_id in (SELECT
	DISTINCT
	anonymous_customer_id
FROM test_schema.activity_stream
WHERE (
	anonymous_customer_id is not NULL AND
	_activity_source = 'remove_internal_users'
))
))
