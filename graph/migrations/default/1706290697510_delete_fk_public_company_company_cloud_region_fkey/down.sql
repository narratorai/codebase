alter table "public"."company"
  add constraint "company_cloud_region_fkey"
  foreign key ("cloud_region")
  references "public"."cloud_region_names"
  ("value") on update restrict on delete restrict;
