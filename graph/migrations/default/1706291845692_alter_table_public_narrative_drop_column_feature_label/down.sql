alter table "public"."narrative" alter column "feature_label" drop not null;
alter table "public"."narrative" add column "feature_label" text;
