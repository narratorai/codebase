alter table "public"."dim_table"
  add constraint "dim_table_company_id_fkey"
  foreign key ("company_id")
  references "public"."company"
  ("id") on update cascade on delete cascade;
