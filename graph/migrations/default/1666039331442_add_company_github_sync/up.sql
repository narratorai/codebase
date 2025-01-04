
CREATE TABLE "public"."company_github_sync" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "company_id" uuid NOT NULL, "user_id" uuid NOT NULL,
  "installation_id" integer NOT NULL,
  "target_repo" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON UPDATE restrict ON DELETE restrict,
  FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON UPDATE restrict ON DELETE restrict,
  UNIQUE ("installation_id"),
  UNIQUE ("company_id", "user_id")
);
COMMENT ON TABLE "public"."company_github_sync" IS E'GitHub Sync App Configuration';
CREATE OR REPLACE FUNCTION "public"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "set_public_company_github_sync_updated_at"
BEFORE UPDATE ON "public"."company_github_sync"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_company_github_sync_updated_at" ON "public"."company_github_sync" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE EXTENSION IF NOT EXISTS pgcrypto;

comment on column "public"."company_github_sync"."installation_id" is E'The id github assigns to the app installation';

comment on column "public"."company_github_sync"."target_repo" is E'The repo to enable sync on. Must be in the format owner/repo';

alter table "public"."company_github_sync" add constraint "valid_repo" check (trim(target_repo) ILIKE '%/%' AND trim(target_repo) NOT ILIKE '/%' AND trim(target_repo) NOT ILIKE '%/' AND trim(target_repo) <> '/');
