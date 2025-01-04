alter table "public"."user_access_role"
  add constraint "user_access_role_company_user_id_fkey"
  foreign key ("company_user_id")
  references "public"."company_user"
  ("id") on update cascade on delete cascade;
