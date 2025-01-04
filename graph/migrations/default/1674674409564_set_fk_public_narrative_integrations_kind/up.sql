alter table "public"."narrative_integrations"
  add constraint "narrative_integrations_kind_fkey"
  foreign key ("kind")
  references "public"."narrative_integeration_kind"
  ("value") on update cascade on delete cascade;
