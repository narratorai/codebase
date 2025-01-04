CREATE  INDEX "has_training_index" on
  "public"."dataset" using btree ("company_id", "has_training");
