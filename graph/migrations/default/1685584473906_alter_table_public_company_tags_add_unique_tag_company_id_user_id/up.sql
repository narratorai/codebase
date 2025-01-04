alter table "public"."company_tags" add constraint "company_tags_tag_company_id_user_id_key" unique ("tag", "company_id", "user_id");
