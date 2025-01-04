comment on column "public"."company"."cloud_region" is E'Companies on the platform';
alter table "public"."company" alter column "cloud_region" set default ''us'::text';
alter table "public"."company" alter column "cloud_region" drop not null;
alter table "public"."company" add column "cloud_region" text;
