CREATE OR REPLACE VIEW "public"."table_team_permissions" AS 
 SELECT t.id,
    t.created_at,
    t.team_id,
    t.related_id AS table_id,
    t.can_edit
   FROM team_permission t
  WHERE (t.related_to = 'table'::text);
