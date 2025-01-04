alter table "public"."query_template"
  add constraint "query_template_transformation_kind_fkey"
  foreign key ("transformation_kind")
  references "public"."transformation_kinds"
  ("value") on update cascade on delete no action;
