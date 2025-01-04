CREATE TABLE "public"."slowly_changing_customer_dims" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "table_id" uuid NOT NULL, "dim_table_id" uuid NOT NULL, "slowly_changing_ts_column" text NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("dim_table_id") REFERENCES "public"."dim_table"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("table_id") REFERENCES "public"."company_table"("id") ON UPDATE cascade ON DELETE cascade, UNIQUE ("table_id", "dim_table_id"));
CREATE EXTENSION IF NOT EXISTS pgcrypto;
