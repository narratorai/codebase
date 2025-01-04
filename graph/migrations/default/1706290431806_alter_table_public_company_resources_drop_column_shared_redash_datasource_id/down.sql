comment on column "public"."company_resources"."shared_redash_datasource_id" is E'Resources provisioned for a company, and their config. NOTE this table should _not_ be exposed to users directly.';
alter table "public"."company_resources" alter column "shared_redash_datasource_id" drop not null;
alter table "public"."company_resources" add column "shared_redash_datasource_id" int4;
