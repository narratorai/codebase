comment on column "public"."company"."s3_bucket" is E'Companies on the platform';
alter table "public"."company" alter column "s3_bucket" drop not null;
alter table "public"."company" add column "s3_bucket" text;
