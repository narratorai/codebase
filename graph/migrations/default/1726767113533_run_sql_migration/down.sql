-- Could not auto-generate a down migration.
-- Please write an appropriate down migration for the SQL below:
-- CREATE
-- OR REPLACE VIEW "public"."dim_team_permissions" AS
-- SELECT
--   t.id,
--   t.created_at,
--   t.team_id,
--   t.related_id AS dim_id,
--   t.can_edit
-- FROM
--   team_permission t
-- WHERE
--   (t.related_to = 'dim' :: text);
