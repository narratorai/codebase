comment on column "public"."company"."delete_prefix" is E'Companies on the platform';
alter table "public"."company" alter column "delete_prefix" drop not null;
alter table "public"."company" add column "delete_prefix" text;
