-- Could not auto-generate a down migration.
-- Please write an appropriate down migration for the SQL below:
-- DROP INDEX dataset_versions_idx;
-- CREATE INDEX dataset_versions_idx ON versions (related_id, created_at DESC) WHERE related_to = 'dataset';
