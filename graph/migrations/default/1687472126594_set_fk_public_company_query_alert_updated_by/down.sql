alter table "public"."company_query_alert" drop constraint "company_query_alert_updated_by_fkey",
  add constraint "company_query_alert_updated_by_fkey"
  foreign key ("updated_by")
  references "public"."user"
  ("id") on update no action on delete no action;
