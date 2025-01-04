comment on column "public"."user_training_question"."updated_at" is E'Represents questions by users about llm_trainings';
alter table "public"."user_training_question" alter column "updated_at" set default now();
alter table "public"."user_training_question" alter column "updated_at" drop not null;
alter table "public"."user_training_question" add column "updated_at" timestamptz;
