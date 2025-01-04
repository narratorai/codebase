comment on column "public"."activity_dim"."table_join_column" is E'replacement to enriched_transformation_activity';
alter table "public"."activity_dim" alter column "table_join_column" drop not null;
alter table "public"."activity_dim" add column "table_join_column" text;
