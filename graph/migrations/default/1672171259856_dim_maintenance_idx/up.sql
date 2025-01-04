CREATE INDEX active_maintenance_dim_index on activity_maintenance (dim_table_id) WHERE (ended_at IS NULL);
