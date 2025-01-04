CREATE  INDEX "customer_dim_table_idx" on
  "public"."company_table" using btree ("customer_dim_table_id");
