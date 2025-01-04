alter table "public"."team_user"
  add constraint "team_user_user_id_fkey"
  foreign key ("user_id")
  references "public"."user"
  ("id") on update cascade on delete cascade;
