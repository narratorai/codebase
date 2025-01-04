alter table "public"."training_request"
  add constraint "training_request_dataset_id_fkey"
  foreign key ("dataset_id")
  references "public"."dataset"
  ("id") on update cascade on delete no action;
