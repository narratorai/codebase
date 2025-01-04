comment on column "public"."company"."cloud" is E'Companies on the platform';
alter table "public"."company" alter column "cloud" set default ''aws'::text';
alter table "public"."company" alter column "cloud" drop not null;
alter table "public"."company" add column "cloud" text;
