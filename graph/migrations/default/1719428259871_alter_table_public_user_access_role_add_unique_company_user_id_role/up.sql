alter table "public"."user_access_role" add constraint "user_access_role_company_user_id_role_key" unique ("company_user_id", "role");
