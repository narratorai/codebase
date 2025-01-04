alter table "public"."narrative" drop constraint "narrative_updated_by_fkey",
  add constraint "narrative_updated_by_fkey"
  foreign key ("updated_by")
  references "public"."user"
  ("id") on update no action on delete set null;
