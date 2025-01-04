alter table "public"."training_request"
  add constraint "training_request_training_id_fkey"
  foreign key ("training_id")
  references "public"."llm_training"
  ("id") on update cascade on delete cascade;
