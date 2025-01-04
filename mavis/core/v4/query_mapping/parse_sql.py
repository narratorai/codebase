# flake8: noqa
#
# FIXME FIXME deal and remove noqa
# core/v4/query_mapping/parse_sql.py:49:9: F841 local variable 'query_obj' is assigned to but never used
# core/v4/query_mapping/parse_sql.py:53:9: F841 local variable 'col' is assigned to but never used

from components import (
    Query,
    Column,
)

import sqlparse


query = """
SELECT

     t.message_id AS "activity_id"
     , DATE_ADD('minutes', -1, t.timestamp) AS "ts"
     , 'segment' AS "source"
     , t.anonymous_id AS "source_id"
     , lower(t.user_id) AS "customer"
     , 'loaded_question' AS "activity"
     , NVL(m.human_readable, c.question_id) AS "feature_1"
     , c.type AS "feature_2"
     , NULL AS "feature_3"
     , NULL AS "revenue_impact"
     , t.context_page_url AS "link"

FROM mybundle_website.tracks AS t
JOIN mybundle_website.answer_submitted c
    on (c.message_id = t.message_id)
LEFT JOIN mybundle_question_id.mapping as m
    on (c.question_id = m.id_field)

where c.test_or_live = 'live'
    and t.event = 'Answer Submitted'
    and c.question_id is not null
"""


def parse_sql(query):
    # break down the sql to an ast
    query_ast = sqlparse.parse(query)[0]

    if query_ast.get_type() == "SELECT":
        query = Query()

    return query_ast


def map_tree(obj, query_obj=None):
    if isinstance(obj, sqlparse.sql.Statement):
        query_obj = Query()

        # parse the query
    elif isinstance(obj, sqlparse.sql.Identifier):
        col = Column()
