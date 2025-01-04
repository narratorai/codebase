alter table "public"."narrative_template"
  add constraint "narrative_template_type_fkey"
  foreign key ("type")
  references "public"."narrative_types"
  ("value") on update cascade on delete set null;
