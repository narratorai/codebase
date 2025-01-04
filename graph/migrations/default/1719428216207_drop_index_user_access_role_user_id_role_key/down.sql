CREATE  INDEX "user_access_role_user_id_role_key" on
  "public"."user_access_role" using btree ("role", "user_id");
