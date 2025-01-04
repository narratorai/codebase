alter table "public"."dim_table" drop constraint "dim_table_schema_table_key";
alter table "public"."dim_table" add constraint "dim_table_table_schema_company_id_key" unique ("table", "schema", "company_id");
