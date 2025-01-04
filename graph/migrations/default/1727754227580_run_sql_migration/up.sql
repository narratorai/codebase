CREATE VIEW narrative_versions AS (
SELECT
    id,
    created_at,
    related_id as narrative_id,
    s3_key
FROM versions s 
where related_to = 'narrative'
);
