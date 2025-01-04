CREATE TABLE "public"."user_api_keys" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "label" text, "user_id" uuid NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "revoked_at" timestamptz, PRIMARY KEY ("id") , FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON UPDATE cascade ON DELETE cascade);
CREATE EXTENSION IF NOT EXISTS pgcrypto;
