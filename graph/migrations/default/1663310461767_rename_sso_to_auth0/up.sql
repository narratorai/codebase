
alter table "public"."company_sso" rename to "company_auth0";

comment on table "public"."company_auth0" is E'Company Auth0 Configuration';

comment on column "public"."company_auth0"."org_id" is E'Auth0 Organization Id';

alter table "public"."company_auth0" add column "connection_id" text null unique;

comment on column "public"."company_auth0"."connection_id" is E'auth0 enterprise connection id for company sso';

alter table "public"."company_auth0" add constraint "valid-enforce-sso" check ((enforce_sso::integer) = 0 OR (enforce_sso = true AND connection_id IS NOT NULL));

alter table "public"."company_auth0" add column "assign_membership_on_login" boolean null;

comment on column "public"."company_auth0"."assign_membership_on_login" is E'should users logging in with the company connection automatically be added to the auth0 org?';




