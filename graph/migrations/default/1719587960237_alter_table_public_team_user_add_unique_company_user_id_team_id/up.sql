alter table "public"."team_user" add constraint "team_user_company_user_id_team_id_key" unique ("company_user_id", "team_id");
