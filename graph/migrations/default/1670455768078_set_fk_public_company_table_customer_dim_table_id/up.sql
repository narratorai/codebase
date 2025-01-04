alter table "public"."company_table"
  add constraint "company_table_customer_dim_table_id_fkey"
  foreign key ("customer_dim_table_id")
  references "public"."dim_table"
  ("id") on update cascade on delete set null;
