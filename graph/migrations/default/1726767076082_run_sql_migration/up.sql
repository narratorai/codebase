CREATE INDEX dim_team_permission_idx ON team_permission (related_id) WHERE related_to = 'dim';
