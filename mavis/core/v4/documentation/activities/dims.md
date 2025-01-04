# Additional  Dimensions

These are dimensions that will be joined when a column is used.


For example:
Lets say the inputs are
- Activity Join Column: activity_id
- Table: dim_products
- Join Column: id

This means that when using this Activity all the columns from the `dim_products` table will be available and if used we will join the dim_products table using `actvitiy_id = dim_products.id`






-----



# FAQ

**When should I make a dimension vs using features on the activity?**

There are several reasons when a dimension is recommended over features:
1. Feature that are not as often used
2. Features that are really large so you don't want to add to the feature_json
3. Features that don't directly relate to the activity (i.e view_product, might have a feature called `sku` and you can have a dimension that has all the data about that sku)
4. Features that relate to multiple activities
5. Features that are slowly changing dimensions
6. Features that already exist in a table.  (i.e. `updated_opportunity_stage` activity can just join to `salesforce.opportunity` using the opportunity_id)
