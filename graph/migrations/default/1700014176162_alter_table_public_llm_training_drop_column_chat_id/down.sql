alter table "public"."llm_training" alter column "chat_id" drop not null;
alter table "public"."llm_training" add column "chat_id" uuid;
