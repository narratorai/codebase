alter table "public"."transformation" drop constraint "transformation_updated_by_fkey",
  add constraint "transformation_updated_by_fkey"
  foreign key ("updated_by")
  references "public"."user"
  ("id") on update no action on delete no action;
