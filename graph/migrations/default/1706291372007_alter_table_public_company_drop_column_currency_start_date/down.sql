comment on column "public"."company"."currency_start_date" is E'Companies on the platform';
alter table "public"."company" alter column "currency_start_date" set default to_date('2018-01-01'::text, 'YYYY-MM-DD'::text);
alter table "public"."company" alter column "currency_start_date" drop not null;
alter table "public"."company" add column "currency_start_date" date;
