CREATE VIEW dataset_versions AS (
SELECT
    id,
    created_at,
    related_id as dataset_id,
    s3_key
FROM versions s 
where related_to = 'dataset'
);
