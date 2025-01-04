alter table "public"."company"
  add constraint "company_datacenter_region_fkey"
  foreign key ("datacenter_region")
  references "public"."datacenter_region"
  ("value") on update restrict on delete restrict;
