CREATE  INDEX "dim_indx" on
  "public"."slowly_changing_customer_dims" using btree ("dim_table_id");
