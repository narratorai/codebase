 INSERT INTO test_schema.stg__activity_stream
  (activity, activity_id, customer, link, revenue_impact, anonymous_customer_id, ts, _run_at, _activity_source, feature_json, activity_repeated_at, activity_occurrence)
 (SELECT
	s.activity
	, s.activity_id
	, LOWER(CASE WHEN s.customer in ('None', 'none', '', ' ', 'null', 'NULL', 'nil') THEN NULL ELSE s.customer END) AS customer
	, s.link
	, FLOAT(s.revenue_impact) AS revenue_impact
	, CASE WHEN CONCAT(s.source, s.source_id) in ('None', 'none', '', ' ', 'null', 'NULL', 'nil') THEN NULL ELSE CONCAT(s.source, s.source_id) END AS anonymous_customer_id
	, s.ts
	, NOW() AS _run_at
	, 'started_sessions' AS _activity_source
	, to_json(named_struct('a1', s.feature_1, 'a2', s.feature_2, 'a3', s.feature_3)) AS feature_json
	, NULL AS activity_repeated_at
	, NULL AS activity_occurrence
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
) AS s
WHERE (
	DATE(s.ts) > DATE('2021-11-03')  AND
	s.ts <= TIMESTAMP('2022-05-18T23:19:49.117237')
))
