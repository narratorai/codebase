alter table "public"."query_template"
  add constraint "query_template_transformation_update_type_fkey"
  foreign key ("transformation_update_type")
  references "public"."transformation_update_types"
  ("value") on update cascade on delete no action;
