alter table "public"."transformation_test" drop constraint "transformation_test_updated_by_fkey",
  add constraint "transformation_test_updated_by_fkey"
  foreign key ("updated_by")
  references "public"."user"
  ("id") on update no action on delete set null;
