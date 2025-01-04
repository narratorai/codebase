comment on column "public"."activity_dim"."table_schema" is E'replacement to enriched_transformation_activity';
alter table "public"."activity_dim" alter column "table_schema" drop not null;
alter table "public"."activity_dim" add column "table_schema" text;
