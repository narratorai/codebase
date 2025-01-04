alter table "public"."activity_maintenance"
  add constraint "activity_maintenance_dim_table_id_fkey"
  foreign key ("dim_table_id")
  references "public"."dim_table"
  ("id") on update cascade on delete cascade;
