CREATE  INDEX "dim_table_schema_table_key" on
  "public"."dim_table" using btree ("schema", "table");
