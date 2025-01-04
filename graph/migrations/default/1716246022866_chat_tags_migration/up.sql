CREATE
OR REPLACE VIEW "public"."chat_tags" AS
SELECT
  tag.id,
  tag.created_at,
  tag.updated_at,
  tag.tag_id,
  tag.related_id AS chat_id
FROM
  tag
WHERE
  (tag.related_to = 'chat' :: text);
