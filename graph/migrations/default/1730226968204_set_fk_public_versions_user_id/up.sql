alter table "public"."versions"
  add constraint "versions_user_id_fkey"
  foreign key ("user_id")
  references "public"."user"
  ("id") on update cascade on delete set null;
