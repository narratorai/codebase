comment on column "public"."company"."refund_prefix" is E'Companies on the platform';
alter table "public"."company" alter column "refund_prefix" drop not null;
alter table "public"."company" add column "refund_prefix" text;
