CREATE  INDEX "user_table_index" on
  "public"."chat" using btree ("created_by", "table_id");
