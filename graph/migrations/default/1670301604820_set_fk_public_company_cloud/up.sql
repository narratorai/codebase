alter table "public"."company"
  add constraint "company_cloud_fkey"
  foreign key ("cloud")
  references "public"."clouds"
  ("value") on update restrict on delete restrict;
