CREATE TABLE "public"."clouds" ("value" text NOT NULL, "description" text, PRIMARY KEY ("value") , UNIQUE ("value"));COMMENT ON TABLE "public"."clouds" IS E'Enum table for cloud options';
