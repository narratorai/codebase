comment on column "public"."company"."agreed_to_contract_date" is E'Companies on the platform';
alter table "public"."company" alter column "agreed_to_contract_date" drop not null;
alter table "public"."company" add column "agreed_to_contract_date" date;
