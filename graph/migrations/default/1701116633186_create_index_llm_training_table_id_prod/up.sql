CREATE  INDEX "llm_training_table_id_prod" on
  "public"."llm_training" using btree ("table_id", "in_production");
