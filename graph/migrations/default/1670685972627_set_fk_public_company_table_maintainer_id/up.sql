alter table "public"."company_table"
  add constraint "company_table_maintainer_id_fkey"
  foreign key ("maintainer_id")
  references "public"."user"
  ("id") on update cascade on delete set null;
