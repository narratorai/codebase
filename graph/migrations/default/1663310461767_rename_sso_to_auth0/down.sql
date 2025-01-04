
alter table "public"."company_auth0" drop column "assign_membership_on_login"

alter table "public"."company_auth0" drop constraint "valid-enforce-sso";

alter table "public"."company_auth0" drop column "connection_id"

comment on column "public"."company_auth0"."org_id" is E'WorkOS Organization Id';

comment on table "public"."company_auth0" is NULL;

alter table "public"."company_auth0" rename to "company_sso";
