CREATE  INDEX "table_index" on
  "public"."slowly_changing_customer_dims" using btree ("table_id");
