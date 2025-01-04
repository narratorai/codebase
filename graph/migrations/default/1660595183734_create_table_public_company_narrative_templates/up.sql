CREATE TABLE "public"."company_narrative_templates" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "company_id" uuid NOT NULL, "template_name" text NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON UPDATE cascade ON DELETE cascade, UNIQUE ("company_id", "template_name"), UNIQUE ("id"));
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
CREATE TRIGGER "set_public_company_narrative_templates_updated_at"
BEFORE UPDATE ON "public"."company_narrative_templates"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_company_narrative_templates_updated_at" ON "public"."company_narrative_templates" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE EXTENSION IF NOT EXISTS pgcrypto;
