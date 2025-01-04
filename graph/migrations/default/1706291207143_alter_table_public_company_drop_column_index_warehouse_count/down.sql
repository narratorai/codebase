comment on column "public"."company"."index_warehouse_count" is E'Companies on the platform';
alter table "public"."company" alter column "index_warehouse_count" set default 0;
alter table "public"."company" alter column "index_warehouse_count" drop not null;
alter table "public"."company" add column "index_warehouse_count" int4;
