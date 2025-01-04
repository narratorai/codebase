alter table "public"."user_access_role"
  add constraint "user_access_role_user_id_fkey"
  foreign key ("user_id")
  references "public"."user"
  ("id") on update cascade on delete cascade;
