DROP INDEX narrative_versions_idx;
CREATE INDEX narrative_versions_idx ON versions (related_id, created_at DESC) WHERE related_to = 'narrative';
