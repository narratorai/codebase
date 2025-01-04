SELECT
	s.activity
	, s.activity_id
	, LOWER(CASE WHEN s.customer in ('None', 'none', '', ' ', 'null', 'NULL', 'nil') THEN NULL ELSE s.customer END) AS "customer"
	, s.link
	, s.revenue_impact
	, CASE WHEN CONCAT(s.source, s.source_id) in ('None', 'none', '', ' ', 'null', 'NULL', 'nil') THEN NULL ELSE CONCAT(s.source, s.source_id) END AS "anonymous_customer_id"
	, s.ts
	, (SELECT s.feature_1 as a1, s.feature_2 as a2, s.feature_3 as a3 FOR JSON PATH, WITHOUT_ARRAY_WRAPPER) AS "feature_json"
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
