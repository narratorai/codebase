alter table "public"."transformation"
  add constraint "transformation_task_id_fkey"
  foreign key ("task_id")
  references "public"."company_task"
  ("id") on update set null on delete set null;
