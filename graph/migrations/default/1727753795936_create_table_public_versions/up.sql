CREATE TABLE "public"."versions" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "related_to" text NOT NULL, "related_id" uuid NOT NULL, "s3_key" text NOT NULL, PRIMARY KEY ("id") );
CREATE EXTENSION IF NOT EXISTS pgcrypto;
