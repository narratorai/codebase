CREATE INDEX narrative_run_versions_idx ON versions (related_id, created_at DESC) WHERE related_to = 'narrative_run' ;
