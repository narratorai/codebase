alter table "public"."team_user" add constraint "team_user_team_id_user_id_key" unique ("team_id", "user_id");
