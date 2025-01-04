alter table "public"."narrative" drop constraint "narrative_created_by_fkey",
  add constraint "narrative_created_by_fkey"
  foreign key ("created_by")
  references "public"."user"
  ("id") on update restrict on delete restrict;
