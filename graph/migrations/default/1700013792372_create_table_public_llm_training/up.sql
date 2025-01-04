CREATE TABLE "public"."llm_training" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "question" text NOT NULL, "answer" text NOT NULL, "dataset_id" uuid, "chat_id" uuid, "created_by" uuid NOT NULL, "table_id" uuid NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON UPDATE no action ON DELETE no action, FOREIGN KEY ("dataset_id") REFERENCES "public"."dataset"("id") ON UPDATE no action ON DELETE no action, FOREIGN KEY ("table_id") REFERENCES "public"."company_table"("id") ON UPDATE no action ON DELETE no action);
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
CREATE TRIGGER "set_public_llm_training_updated_at"
BEFORE UPDATE ON "public"."llm_training"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_llm_training_updated_at" ON "public"."llm_training"
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE EXTENSION IF NOT EXISTS pgcrypto;
