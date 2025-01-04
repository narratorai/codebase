alter table "public"."activity_dim"
  add constraint "activity_dim_dim_table_id_fkey"
  foreign key ("dim_table_id")
  references "public"."dim_table"
  ("id") on update cascade on delete cascade;
