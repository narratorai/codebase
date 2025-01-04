CREATE OR REPLACE VIEW "public"."activity_team_permissions" AS 
 SELECT t.id,
    t.created_at,
    t.team_id,
    t.related_id AS activity_id,
    t.can_edit
   FROM team_permission t
  WHERE (t.related_to = 'activity'::text);
