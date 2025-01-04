alter table "public"."narrative" drop constraint "narrative_type_fkey",
  add constraint "narrative_type_fkey"
  foreign key ("type")
  references "public"."narrative_types"
  ("value") on update cascade on delete no action;
