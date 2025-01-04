alter table "public"."company_github_sync" add constraint "company_github_sync_user_id_company_id_key" unique ("user_id", "company_id");
