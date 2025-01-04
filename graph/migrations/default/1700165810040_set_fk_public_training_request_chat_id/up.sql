alter table "public"."training_request"
  add constraint "training_request_chat_id_fkey"
  foreign key ("chat_id")
  references "public"."chat"
  ("id") on update cascade on delete cascade;
