comment on column "public"."company"."use_temporary_tables" is E'Companies on the platform';
alter table "public"."company" alter column "use_temporary_tables" set default false;
alter table "public"."company" alter column "use_temporary_tables" drop not null;
alter table "public"."company" add column "use_temporary_tables" bool;
