CREATE  INDEX "llm_training_custom_def" on
  "public"."llm_training" using btree ("table_id", "custom_definition");
