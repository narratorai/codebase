comment on column "public"."company"."staging_schema" is E'Companies on the platform';
alter table "public"."company" alter column "staging_schema" set default ''dw_stage'::text';
alter table "public"."company" alter column "staging_schema" drop not null;
alter table "public"."company" add column "staging_schema" text;
