alter table "public"."narrative" alter column "feature_slug" drop not null;
alter table "public"."narrative" add column "feature_slug" text;
