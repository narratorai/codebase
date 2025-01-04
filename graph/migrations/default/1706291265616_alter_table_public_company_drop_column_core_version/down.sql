comment on column "public"."company"."core_version" is E'Companies on the platform';
alter table "public"."company" alter column "core_version" set default ''v4'::text';
alter table "public"."company"
  add constraint "company_core_version_fkey"
  foreign key (core_version)
  references "public"."company_config_core_version"
  (value) on update restrict on delete restrict;
alter table "public"."company" alter column "core_version" drop not null;
alter table "public"."company" add column "core_version" text;
