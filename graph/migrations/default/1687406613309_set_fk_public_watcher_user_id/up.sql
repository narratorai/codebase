alter table "public"."watcher" drop constraint "watcher_user_id_fkey",
  add constraint "watcher_user_id_fkey"
  foreign key ("user_id")
  references "public"."user"
  ("id") on update no action on delete cascade;
