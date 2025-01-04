comment on column "public"."company"."batch_version" is E'Companies on the platform';
alter table "public"."company" alter column "batch_version" set default ''v2'::text';
alter table "public"."company"
  add constraint "company_batch_version_fkey"
  foreign key (batch_version)
  references "public"."company_config_batch_version"
  (value) on update restrict on delete restrict;
alter table "public"."company" alter column "batch_version" drop not null;
alter table "public"."company" add column "batch_version" text;
