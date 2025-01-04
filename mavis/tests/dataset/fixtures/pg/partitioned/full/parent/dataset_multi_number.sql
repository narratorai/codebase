SELECT
	*
FROM (
	SELECT
		c.activity_id
		, c.timestamp
		, c.customer
		, c.revenue_impact
		, c.link
		, c.activity_occurrence
		, c.did_order
		, c.ingredient_id
		, c.is_swapped
		, c.ordered_product_id
		, c.ordered_quantity
		, c.order_id
		, c.product_requirement
		, c.recipe_id
		, c.stock_ingredient_id
		, before.last_before_considered_ordering_ingredients_timestamp
		, before.last_before_considered_ordering_ingredients_activity_id
		, before.last_before_product_requirement_activity
		, before.last_before_product_requirement_enriched
		, CASE WHEN last_before_considered_ordering_ingredients_timestamp is not NULL THEN 1 ELSE 0 END AS "did_considered_ordering_ingredient_before"
		, floor(EXTRACT(EPOCH FROM (join_ts - last_before_considered_ordering_ingredients_timestamp)) / 60) AS "minutes_from_considered_ordering_ingredient"
	FROM (
 		SELECT
			s.activity_id
			, s.ts AS "timestamp"
			, s.customer
			, s.revenue_impact
			, s.link
			, ROW_NUMBER() over (PARTITION by s.customer ORDER BY s.ts) AS "activity_occurrence"
			, s.feature_json ->> 'did_order' AS "did_order"
			, s.feature_json ->> 'ingredient_id' AS "ingredient_id"
			, s.feature_json ->> 'is_swapped' AS "is_swapped"
			, s.feature_json ->> 'ordered_product_id' AS "ordered_product_id"
			, s.feature_json ->> 'ordered_quantity' AS "ordered_quantity"
			, s.feature_json ->> 'order_id' AS "order_id"
			, s.feature_json ->> 'product_requirement' AS "product_requirement"
			, s.feature_json ->> 'recipe_id' AS "recipe_id"
			, s.feature_json ->> 'stock_ingredient_id' AS "stock_ingredient_id"
			, s.feature_json ->> 'stock_ingredient_id' AS "app_feature_stock_ingredient_id"
			, s.customer AS "join_customer"
			, s.ts AS "join_ts"
			, s.activity_id AS "join_cohort_id"
		FROM (
 			SELECT
				*
			FROM test_schema.activity_stream_considered_ordering_ingredient AS s
) AS s
) AS c
	LEFT JOIN (
 		SELECT
			s.*
			, enriched_ingredients_tbl.product_requirement AS "last_before_product_requirement_enriched"
		FROM (
			SELECT
				join_customer
				, join_cohort_id
				, MAX(last_before_considered_ordering_ingredients_timestamp) AS "last_before_considered_ordering_ingredients_timestamp"
				, NULLIF(SUBSTRING(MAX(CONCAT(DATE_TRUNC('second', s.last_before_considered_ordering_ingredients_timestamp), COALESCE(last_before_considered_ordering_ingredients_activity_id,''))),20, 1000),'') AS "last_before_considered_ordering_ingredients_activity_id"
				, MAX(last_before_product_requirement_activity) AS "last_before_product_requirement_activity"
				, NULLIF(SUBSTRING(MAX(CONCAT(DATE_TRUNC('second', s.last_before_considered_ordering_ingredients_timestamp), COALESCE(join_enriched_activity_id_0_a,''))),20, 1000),'') AS "join_enriched_activity_id_0_a"
			FROM (
				SELECT
					s.customer AS "join_customer"
					, c.join_cohort_id
					, s.ts
					, CASE WHEN ( s.activity = 'considered_ordering_ingredient' AND s.feature_json ->> 'did_order' = True AND s.feature_json ->> 'stock_ingredient_id' = c.app_feature_stock_ingredient_id ) THEN s.ts END AS "last_before_considered_ordering_ingredients_timestamp"
					, CASE WHEN ( s.activity = 'considered_ordering_ingredient' AND s.feature_json ->> 'did_order' = True AND s.feature_json ->> 'stock_ingredient_id' = c.app_feature_stock_ingredient_id ) THEN s.activity_id END AS "last_before_considered_ordering_ingredients_activity_id"
					, CASE WHEN ( s.activity = 'considered_ordering_ingredient' AND s.feature_json ->> 'did_order' = True AND s.feature_json ->> 'stock_ingredient_id' = c.app_feature_stock_ingredient_id AND ROW_NUMBER() over (PARTITION by s.activity, s.customer, c.join_cohort_id, CASE WHEN ( s.feature_json ->> 'did_order' = True AND s.feature_json ->> 'stock_ingredient_id' = c.app_feature_stock_ingredient_id ) THEN 1 END ORDER BY s.ts desc) = 1 ) THEN s.feature_json ->> 'product_requirement' END AS "last_before_product_requirement_activity"
					, CASE WHEN ( s.activity = 'considered_ordering_ingredient' AND s.feature_json ->> 'did_order' = True AND s.feature_json ->> 'stock_ingredient_id' = c.app_feature_stock_ingredient_id ) THEN s.feature_json ->> 'ingredient_id' END AS "join_enriched_activity_id_0_a"
				FROM (
 					SELECT
						s.activity_id
						, s.ts AS "timestamp"
						, s.customer
						, s.revenue_impact
						, s.link
						, ROW_NUMBER() over (PARTITION by s.customer ORDER BY s.ts) AS "activity_occurrence"
						, s.feature_json ->> 'did_order' AS "did_order"
						, s.feature_json ->> 'ingredient_id' AS "ingredient_id"
						, s.feature_json ->> 'is_swapped' AS "is_swapped"
						, s.feature_json ->> 'ordered_product_id' AS "ordered_product_id"
						, s.feature_json ->> 'ordered_quantity' AS "ordered_quantity"
						, s.feature_json ->> 'order_id' AS "order_id"
						, s.feature_json ->> 'product_requirement' AS "product_requirement"
						, s.feature_json ->> 'recipe_id' AS "recipe_id"
						, s.feature_json ->> 'stock_ingredient_id' AS "stock_ingredient_id"
						, s.feature_json ->> 'stock_ingredient_id' AS "app_feature_stock_ingredient_id"
						, s.customer AS "join_customer"
						, s.ts AS "join_ts"
						, s.activity_id AS "join_cohort_id"
					FROM (
 						SELECT
							*
						FROM test_schema.activity_stream_considered_ordering_ingredient AS s
) AS s
) AS c
				INNER JOIN (
 					SELECT
						*
					FROM test_schema.activity_stream_considered_ordering_ingredient AS s
) AS s
					ON (
						s.customer = c.join_customer  AND
						(
							s.feature_json ->> 'did_order' = True  AND
							s.feature_json ->> 'stock_ingredient_id' = c.app_feature_stock_ingredient_id
						) AND
						s.ts < c.join_ts
					)
			) AS s
			GROUP BY join_customer, join_cohort_id
		) AS s
		LEFT JOIN test_schema.enriched_ingredients AS enriched_ingredients_tbl
			ON s.join_enriched_activity_id_0_a = enriched_ingredients_tbl.enriched_activity_id
) AS before
		ON (
			c.join_customer = before.join_customer  AND
			c.join_cohort_id = before.join_cohort_id
		)
) AS sub_query
WHERE last_before_considered_ordering_ingredients_activity_id = '338375-58041-215151'
ORDER BY timestamp DESC
