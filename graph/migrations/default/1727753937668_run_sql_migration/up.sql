CREATE INDEX dataset_versions_idx ON versions (related_id) WHERE related_to = 'dataset';
