comment on column "public"."activity_dim"."table_name" is E'replacement to enriched_transformation_activity';
alter table "public"."activity_dim" add constraint "activity_dim_table_schema_table_name_key" unique (table_schema, table_name);
alter table "public"."activity_dim" alter column "table_name" drop not null;
alter table "public"."activity_dim" add column "table_name" text;
