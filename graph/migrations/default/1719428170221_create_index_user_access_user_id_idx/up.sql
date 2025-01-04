CREATE  INDEX "user_access_user_id_idx" on
  "public"."user_access_role" using btree ("user_id");
