CREATE
OR REPLACE VIEW "public"."activity_dim_column_renames" AS
SELECT
  column_renames.id,
  column_renames.created_at,
  column_renames.updated_at,
  column_renames.name,
  column_renames.label,
  column_renames.type,
  column_renames.casting,
  column_renames.description,
  column_renames.related_to,
  column_renames.related_to_id,
  column_renames.has_data,
  column_renames.related_to_id AS activity_dim_id
FROM
  column_renames
WHERE
  (
    column_renames.related_to = 'activity_dim' :: text
  );
