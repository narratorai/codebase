
alter table "public"."company_github_sync" drop constraint "valid_repo";

comment on column "public"."company_github_sync"."target_repo" is NULL;

comment on column "public"."company_github_sync"."installation_id" is NULL;

DROP TABLE "public"."company_github_sync";
