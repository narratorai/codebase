alter table "public"."cloud_regions"
  add constraint "cloud_regions_name_fkey"
  foreign key ("name")
  references "public"."cloud_region_names"
  ("value") on update restrict on delete restrict;
