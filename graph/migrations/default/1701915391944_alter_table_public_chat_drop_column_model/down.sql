alter table "public"."chat" alter column "model" drop not null;
alter table "public"."chat" add column "model" text;
