CREATE  INDEX "user_access_company_user_idx" on
  "public"."user_access_role" using btree ("company_user_id");
