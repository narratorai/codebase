alter table "public"."company_table_aggregation_dim" add constraint "company_table_aggregation_dim_company_table_id_dim_table_id_key" unique ("company_table_id", "dim_table_id");
