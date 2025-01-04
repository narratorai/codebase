alter table "public"."training_request"
  add constraint "training_request_status_fkey"
  foreign key ("status")
  references "public"."trainining_request_status"
  ("value") on update cascade on delete cascade;
