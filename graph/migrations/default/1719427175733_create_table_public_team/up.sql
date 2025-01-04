CREATE TABLE "public"."team" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "name" text NOT NULL, "company_id" uuid NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON UPDATE cascade ON DELETE cascade, UNIQUE ("company_id", "name"));
CREATE EXTENSION IF NOT EXISTS pgcrypto;
