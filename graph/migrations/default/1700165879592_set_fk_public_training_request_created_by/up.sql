alter table "public"."training_request"
  add constraint "training_request_created_by_fkey"
  foreign key ("created_by")
  references "public"."user"
  ("id") on update cascade on delete no action;
