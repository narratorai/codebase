comment on column "public"."company"."redash_api_key" is E'Companies on the platform';
alter table "public"."company" alter column "redash_api_key" drop not null;
alter table "public"."company" add column "redash_api_key" text;
