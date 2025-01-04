alter table "public"."activity_maintenance" drop constraint "activity_maintenance_activity_id_ended_at_key";
alter table "public"."activity_maintenance" add constraint "activity_maintenance_ended_at_activity_id_dim_table_id_key" unique ("ended_at", "activity_id", "dim_table_id");
