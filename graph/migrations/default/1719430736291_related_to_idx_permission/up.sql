CREATE INDEX dataset_team_permission_idx ON team_permission (related_id) WHERE related_to = 'dataset';
CREATE INDEX narrative_team_permission_idx ON team_permission (related_id)
WHERE
    related_to = 'narrative';
CREATE INDEX table_team_permission_idx ON team_permission (related_id)
WHERE
    related_to = 'table';
CREATE INDEX activity_team_permission_idx ON team_permission (related_id)
WHERE
    related_to = 'activity';
