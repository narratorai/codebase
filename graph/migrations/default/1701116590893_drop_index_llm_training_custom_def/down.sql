CREATE  INDEX "llm_training_custom_def" on
  "public"."llm_training" using btree ("custom_definition", "table_id");
