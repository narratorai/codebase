comment on column "public"."company"."redash_datasource_id" is E'Companies on the platform';
alter table "public"."company" alter column "redash_datasource_id" drop not null;
alter table "public"."company" add column "redash_datasource_id" int4;
