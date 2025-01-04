comment on column "public"."company"."update_wlm_count" is E'Companies on the platform';
alter table "public"."company" alter column "update_wlm_count" drop not null;
alter table "public"."company" add column "update_wlm_count" int4;
