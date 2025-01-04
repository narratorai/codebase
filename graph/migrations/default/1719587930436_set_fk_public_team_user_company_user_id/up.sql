alter table "public"."team_user"
  add constraint "team_user_company_user_id_fkey"
  foreign key ("company_user_id")
  references "public"."company_user"
  ("id") on update cascade on delete cascade;
