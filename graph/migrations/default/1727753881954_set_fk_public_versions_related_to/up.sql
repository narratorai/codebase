alter table "public"."versions"
  add constraint "versions_related_to_fkey"
  foreign key ("related_to")
  references "public"."tag_relations"
  ("value") on update cascade on delete cascade;
