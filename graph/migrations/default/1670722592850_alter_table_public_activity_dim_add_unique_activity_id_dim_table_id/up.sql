alter table "public"."activity_dim" add constraint "activity_dim_activity_id_dim_table_id_key" unique ("activity_id", "dim_table_id");
