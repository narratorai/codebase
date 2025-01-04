alter table "public"."cloud_regions"
  add constraint "cloud_regions_cloud_fkey"
  foreign key ("cloud")
  references "public"."clouds"
  ("value") on update restrict on delete restrict;
