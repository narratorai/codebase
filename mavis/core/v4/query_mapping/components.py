import unicodedata
from collections import OrderedDict
from datetime import datetime

import pytz

from core import utils
from core.constants import BLANK_TS

from .config import (
    ALL_TYPES,
    CONFIG,
    DATE_SECONDS,
    FUNCTIONS,
    LOWER_OPERATORS,
    MSSQL_TIMEZONE_MAPPING,
    OPERATIONS,
)


# handle removing an alias
def _remove_column_alias(col):
    if isinstance(col, Column):
        col.table_alias = None
    elif isinstance(col, list):
        for c in col:
            _remove_column_alias(c)


class Query:
    def __init__(self, language=None, json_obj=None):
        assert language is not None
        self.language = language

        # Initialize the main components of the query
        self.is_distinct = False
        self.columns = []
        self.from_table = None
        self.joins = []
        self.where = None

        self.union = None

        self.ctes = OrderedDict()

        # aggregations
        self.group_by = []
        self.order_by = []
        self.having = None
        self.input_fields = dict()

        self.limit = None
        self.offset = None

        self.comments = []

        if json_obj:
            self.is_distinct = json_obj["is_distinct"]
            self.columns = [Column(language=self.language, json_obj=c) for c in json_obj["columns"]]
            self.from_table = Table(language=self.language, json_obj=json_obj["from_table"])
            if json_obj.get("joins"):
                self.joins = [Join(language=self.language, json_obj=j) for j in json_obj["joins"]]

            if json_obj["where"]:
                if json_obj["where"].get("filters"):
                    self.where = Filter(language=self.language, json_obj=json_obj["where"])
                else:
                    self.where = Condition(language=self.language, json_obj=json_obj["where"])

            self.union = Query(language=self.language, json_obj=json_obj["union"]) if json_obj["union"] else None

            for k, c in json_obj["ctes"].items():
                self.ctes[k] = Query(language=self.language, json_obj=c)

            # aggregations
            self.group_by = json_obj["group_by"]
            self.order_by = []
            for o in json_obj["order_by"]:
                if isinstance(o, str):
                    temp_o = Order(language=self.language, raw_column=o)
                else:
                    temp_o = Order(language=self.language, json_obj=o)

                self.orderby.append(temp_o)

            if json_obj.get("having"):
                self.having = json_obj["having"]

            if json_obj.get("limit"):
                self.limit = int(json_obj["limit"])

            if json_obj.get("offset"):
                self.offset = json_obj["offset"]

            self.comments = json_obj["comments"]

    def add_fields(self, **kwargs):
        """
        Adds an input field that will be added on run
        """
        self.input_fields.update(**{k: v for k, v in kwargs.items() if v is not None})

    def to_query(self, tab=0, comment=False, ignore_cte=False, **kwargs):
        """"""
        query = []

        input_fields = {
            **self.input_fields,
            **kwargs,
            "ctes": kwargs.get("ctes", self.ctes),
        }

        # handle the CTES
        if len(self.ctes.keys()) > 0 and not ignore_cte and not kwargs.get("nest_ctes"):
            query.append("WITH")
            # add the ctes with parenthis
            for k, item in self.ctes.items():
                query.append(f"{k} AS (")
                # add the query
                query.append(item.to_query(tab + 1, comment, ignore_cte=True))
                # close the indented
                query.append("),")

            # removes the comma
            query[-1] = query[-1][:-1]

        # handle select
        query.append("SELECT")
        select_int = len(query)

        # add the distinct
        if self.is_distinct:
            query.append(utils.indent("DISTINCT", 1))

        # Add all the columns
        for ii, c in enumerate(self.columns):
            query.append(c.to_query(1, comment, is_first=ii == 0, with_alias=True))

            # check for aggregation functions when you don't have a group by
            if len(self.group_by) == 0 and c.kind == "agg_functions":
                raise ValueError("cannot use agg functions without a group by")

        # Add the from table
        if self.from_table:
            query.append(f"FROM {self.from_table.to_query(tab, comment, **input_fields).lstrip()}")

        # add all the joins
        for _ii, j in enumerate(self.joins):
            query.append(j.to_query(tab, comment, **input_fields).lstrip())

        # add the filters
        if self.where:
            query.append("WHERE " + self.where.to_query(tab).lstrip())

        # group by
        if len(self.group_by) > 0:
            if self.language == "bigquery":
                query.append(f"GROUP BY {utils.queryify([g.get_name() for g in self.group_by])}")
            else:
                query.append(f"GROUP BY {utils.queryify(self.group_by)}")

        # add the having filters
        if self.having:
            query.append("HAVING")
            query.append(self.having.to_query(0))

        # order by
        if len(self.order_by) > 0:
            query.append(f"ORDER BY {utils.queryify(self.order_by)}")

        # add the filters
        if self.limit:
            self.limit = int(self.limit)
            if self.language != "mssql_odbc":
                # t-sql does not support limit; uses TOP instead
                query.append(f"LIMIT {self.limit}")
            else:
                query.insert(select_int, utils.indent(f"TOP {self.limit}", 1))

        # add the filters
        if self.offset:
            query.append(f"OFFSET {int(self.offset)}")

        # add the unions
        if self.union:
            # handle the limit subquery issue
            if self.limit or self.offset:
                query.insert(0, "SELECT * FROM (")
                query.append(")")

            query.append("UNION ALL")
            query.append(self.union.to_query(1, comment, ignore_cte, **input_fields))

        # adding comments
        if len(self.comments) > 0 and comment:
            for c in self.comments:
                query.append(f"--{c}")

        # assemble the query
        full_query = "\n".join([utils.indent(q, tab) for q in query])

        # I did this instead of .format because sometime the query had a curly bracket in it and i didn't want it to crash
        for k, val in input_fields.items():
            full_query = full_query.replace(f"{{{k}}}", str(val))

        return full_query

    def dict(self):
        obj = dict(
            is_distinct=self.is_distinct,
            columns=[c.dict() for c in self.columns],
            from_table=self.from_table.dict(),
            joins=[j.dict() for j in self.joins],
            where=_obj_to_dict(self.where),
            union=_obj_to_dict(self.union),
            ctes={k: _obj_to_dict(c) for k, c in self.ctes.items()},
            # aggregations
            group_by=_obj_to_dict(self.group_by),
            order_by=[o.dict() for o in self.order_by],
            having=_obj_to_dict(self.having),
            limit=self.limit,
            offset=self.offset,
            comments=self.comments,
        )

        return obj

    def add_column(self, column):
        """
        adds the column
        """
        # handle dealing with the loop
        if isinstance(column, list):
            for c in column:
                self.add_column(c)
            return None

        # check for name duplication if duplication then add one to the count
        for c in self.get_all_columns():
            if c.get_name(no_count=True) == column.get_name(no_count=True):
                column.set_count(max(c.count, column.count) + 1)

        # add the column
        self.columns.append(column)
        return None

    def set_from(self, table):
        if not isinstance(table, Table):
            raise TypeError("Query must be a Table Object")

        if table.kind is None:
            raise TypeError("Table cannot be None")

        # cascade the ctes
        if table.kind == "query":
            self.ctes = OrderedDict(
                **{k: v for k, v in table.query.ctes.items() if k not in self.ctes.keys()},
                **self.ctes,
            )
            self.input_fields = {**table.query.input_fields, **self.input_fields}

        self.from_table = table

    def add_join(self, join, insert_index=None):
        if not isinstance(join, Join):
            raise TypeError("Query must be a Join Object")

        # if self.from_table is None:
        #     raise TypeError("Please enter set a table first")

        all_aliases = self.get_all_table_alias()
        # check to make sure the aliases is not already used
        if join.table.alias in all_aliases:
            raise TypeError("The alias of the join is already in use")

        # cascade the ctes
        if join.table.kind == "query":
            self.ctes = OrderedDict(**join.table.query.ctes, **self.ctes)
            self.input_fields = {**join.table.query.input_fields, **self.input_fields}

        if insert_index is None:
            self.joins.append(join)
        else:
            self.joins.insert(insert_index, join)

    def set_where(self, where):
        if not isinstance(where, Filter) and not isinstance(where, Condition):
            raise TypeError("where must be a filters Object")

        self.where = where

    def set_union(self, union):
        if not isinstance(union, Query):
            raise TypeError("Union must be a query Object")

        # cascade the ctes
        for k, c in union.ctes.items():
            self.add_cte(k, c, dependent=True)

        self.union = union

    def get_all_unions(self):
        all_unions = []
        if self.union:
            all_unions.append(self.union)
            all_unions.extend(self.union.get_all_unions())
        return all_unions

    def add_cte(self, key, query, dependent=False):
        if key in self.ctes.keys():
            raise ValueError("Cannot add the same cte to the query")

        if not isinstance(query, Query):
            raise TypeError("Query must be a query Object")

        # add all the ctes
        for k, c in query.ctes.items():
            if k not in self.ctes.keys():
                self.add_cte(k, c)

        self.ctes[key] = query

        # move the cte to the top
        if dependent:
            self.ctes.move_to_end(key, last=False)

    def add_group_by(self, group_by):
        # if it is not a list then wrap around it

        if isinstance(group_by, list):
            for g in group_by:
                self.add_group_by(g)
            return None

        elif isinstance(group_by, int):
            self.group_by.append(self.columns[group_by - 1])
        else:
            self.group_by.append(group_by)
        return None

    def add_order_by(self, order_by, asc=True):
        if isinstance(order_by, list):
            for o in order_by:
                self.add_order_by(o, asc)
            return None

        # add the order
        if isinstance(order_by, Column):
            self.order_by.append(Order(language=self.language, column=order_by, asc=asc))
        # handle reference by a number
        elif isinstance(order_by, int):
            self.order_by.append(
                Order(
                    language=self.language,
                    column=(
                        Column(
                            language=self.language,
                            table_column=self.columns[order_by - 1].get_name(),
                        )
                        if self.language not in ("snowflake",)
                        else self.columns[order_by - 1]
                    ),
                    asc=asc,
                )
            )
            if self.language == "mssql_odbc":
                self.limit = 10000
        else:
            self.order_by.append(Order(language=self.language, raw_column=order_by + "" if asc else " DESC"))
        return None

    def set_having(self, having):
        self.having = having

    def make_distinct(self):
        self.is_distinct = True

    def set_limit(self, number):
        self.limit = number

    def set_offset(self, number):
        self.offset = number

    def remove_order(self):
        self.order_by = []
        if self.from_table:
            self.from_table.remove_order()

        for j in self.joins:
            j.remove_order()

        # remove from ctes
        for k in self.ctes.keys():
            self.ctes[k].remove_order()

    def add_comment(self, comment):
        self._extend_list(self.comments, comment)

    def add_filter(self, cond, kind="AND"):
        """
        Handles adding filter without knowing what is going on
        """
        # handle add thing list of filters if there is a list
        if isinstance(cond, list):
            for c in cond:
                self.add_filter(c, kind)
            return None

        if cond is None:
            return None

        # handle the None case
        if self.where is None:
            self.where = cond
            return None

        # if it is a condition then make it a filter
        if isinstance(self.where, Condition):
            self.where = Filter(language=self.language, filters=[self.where])

        # add all the ANDS if they are different
        if kind == "AND" and (len(self.where.filters) == 1 or all(f == "AND" for f in self.where.filters[1::2])):
            # grab all the current queries

            # ppend all the conditions
            if isinstance(cond, Condition):
                current_filters = [fq.to_query() for fq in self.where.filters[::2]]
                if cond.to_query() not in current_filters:
                    self.where.filters.append(kind)
                    self.where.filters.append(cond)

            # if the filter also is all ands then just append those too
            elif len(cond.filters) == 1 or all(f == "AND" for f in cond.filters[1::2]):
                for tf in cond.filters[::2]:
                    self.where.add_filter(tf, kind)

            else:
                self.where.add_filter(cond, kind)

        else:
            self.where.add_filter(cond, kind)

        return None

    def get_all_columns(self, only_names=False, nested_table=None, ignore_computed=False):
        """
        Gets all the columns and cascadign columns
        """
        columns = []
        for c in self.columns:
            # check if it is a * and add all dependencies
            if c.is_all():
                table = c.get_table()
                # look through the table
                if self.from_table and (self.from_table.alias == table or table is None):
                    if self.from_table.kind == "query":
                        columns.extend(
                            self.from_table.query.get_all_columns(
                                only_names=only_names,
                                nested_table=self.from_table.alias,
                            )
                        )
                    elif self.from_table.kind == "cte":
                        columns.extend(
                            self.ctes[self.from_table.cte].get_all_columns(
                                only_names=only_names, nested_table=self.from_table.cte
                            )
                        )

                # look through all the joins
                for j in self.joins:
                    if j.table.alias == table or table is None:
                        if j.table.kind == "query":
                            columns.extend(
                                j.table.query.get_all_columns(only_names=only_names, nested_table=j.table.alias)
                            )
                        elif j.table.kind == "cte":
                            columns.extend(
                                self.ctes[j.table.cte].get_all_columns(
                                    only_names=only_names,
                                    nested_table=self.from_table.cte,
                                )
                            )

            # else add the column
            else:
                if nested_table:
                    c = Column(
                        language=self.language,
                        table_alias=nested_table,
                        table_column=c.get_name(),
                    )

                if not ignore_computed or c.kind not in (
                    "function",
                    "agg_function",
                    "operator",
                ):
                    columns.append(c.get_name() if only_names else c)

        return columns

    def get_all_table_alias(self):
        all_aliases = []

        # add the table alias
        if self.from_table:
            if self.from_table.alias:
                all_aliases.append(self.from_table.alias)

        # look through all the joins
        for j in self.joins:
            if j.table.alias:
                all_aliases.append(j.table.alias)

        return all_aliases

    def get_all_tables(self, recursive=False, ctes=None):
        if recursive:
            if ctes is None:
                ctes = self.ctes

            all_tables = [self.from_table] + [j.table for j in self.joins]
            for t in all_tables:
                if t.query:
                    all_tables.extend(t.query.get_all_tables(True, ctes=ctes))  # noqa: B038
                elif t.cte and ctes.get(t.cte):
                    all_tables.extend(ctes[t.cte].get_all_tables(True, ctes=ctes))  # noqa: B038

            return list(set([t for t in all_tables if t]))

        else:
            return [self.from_table] + [j.table for j in self.joins]

    def get_all_filters(self):
        """
        # returns all the filters
        """
        return self._open_filter(self.where)

    def add_project_id(self, project_id):
        # add the project id to the tables
        for t in self.get_all_tables():
            t.add_project_id(project_id)

    @staticmethod
    def _extend_list(the_list, new_obj):
        """
        Handles adding an array or a object to a list
        """
        if isinstance(new_obj, list):
            the_list.extend(new_obj)
        else:
            the_list.append(new_obj)

    @staticmethod
    def _open_filter(current_filter):
        """"""
        cond = []
        if isinstance(current_filter, Condition):
            cond.append(current_filter)
        elif isinstance(current_filter, Filter):
            for f in current_filter.filters:
                cond.extend(f)
        return cond


class Table:
    def __init__(
        self,
        language=None,
        json_obj=None,
        schema=None,
        table=None,
        cte=None,
        query=None,
        sql=None,
        temp_table=None,
        alias=None,
        comment=None,
        no_wrapping=False,
    ):
        assert language is not None
        self.language = language

        # Kind can be table, temp_table, cte, query, sql
        self.kind = None

        self.no_wrapping = no_wrapping
        self.schema = None
        self.table = None
        self.temp_table = None
        self.cte = None
        self.query = None
        self.sql = None
        self.project_id = None

        # check all the inputs to make sure there is no sql injections
        for w in [schema, table, temp_table, alias]:
            _check_input(w)

        self.alias = utils.slugify(alias)
        self.comment = comment

        if table:
            self.set_table(schema, table)

        elif temp_table:
            self.set_temp_table(temp_table)

        elif cte:
            self.set_cte(cte)

            # set the alias to none if it a ctes
            if self.alias == cte:
                self.alias = None

        elif query:
            self.set_query(query)

        elif sql:
            self.set_raw_sql(sql)

        if json_obj:
            self.kind = json_obj.get("kind")

            self.schema = json_obj.get("schema")
            self.table = json_obj.get("table")

            self.temp_table = json_obj.get("temp_table")

            self.cte = json_obj.get("cte")

            self.query = _dict_to_obj(json_obj.get("query"), language=self.language, desired_type=Query)
            self.sql = json_obj.get("sql")
            self.no_wrapping = json_obj.get("no_wrapping")

            self.alias = json_obj.get("alias")
            self.comment = json_obj.get("comment")

        if (self.query or self.sql) and CONFIG[self.language]["require_alias"] and self.alias is None:
            self.alias = "sub_query"

    def dict(self):
        obj = dict(
            kind=self.kind,
            schema=self.schema,
            table=self.table,
            temp_table=self.temp_table,
            cte=self.cte,
            query=_obj_to_dict(self.query),
            sql=self.sql,
            no_wrapping=self.no_wrapping,
            alias=self.alias,
            comment=self.comment,
        )
        obj = {k: v for k, v in obj.items() if v}
        return obj

    def to_query(self, tab=0, comment=False, **kwargs):
        if self.kind == "table":
            if self.project_id:
                table = f"`{self.project_id}.{self.schema}.{fix_reserved_column(self.language, self.table)}`"
            elif self.schema:
                table = f"{self.schema}.{fix_reserved_column(self.language, self.table)}"
            else:
                table = self.table

        elif self.kind == "temp_table":
            table = fix_reserved_column(self.language, self.temp_table)

        elif self.kind == "cte":
            if kwargs.get("nest_ctes"):
                table = "(\n {} \n)".format(
                    kwargs["ctes"][self.cte].to_query(
                        tab + 1,
                        comment,
                        **{k: v for k, v in kwargs.items() if k != "only_table"},
                    )
                )
            else:
                table = self.cte

        elif self.kind == "query":
            # open parenthesis and add the query
            table = "\n".join(
                [
                    "(",
                    self.query.to_query(
                        tab + 1,
                        comment,
                        ignore_cte=True,
                        **{k: v for k, v in kwargs.items() if k != "only_table"},
                    ),
                    utils.indent(")", tab),
                ]
            )

        elif self.kind == "sql":
            if self.no_wrapping:
                table = "\n".join([utils.indent(line, tab + 1) for line in self.sql.split("\n")])
            else:
                # if it is sql then just insert the sql but indent it
                table = "\n".join(
                    [
                        "(",
                        "\n".join([utils.indent(line, tab + 1) for line in self.sql.split("\n")]),
                        utils.indent(")", tab),
                    ]
                )

        else:
            raise TypeError(f"Not a valid kind : {self.kind}")

        if kwargs.get("only_table"):
            query = table
        else:
            query = "{table} {alias} {comment}".format(
                table=table,
                alias=f"AS {self.alias}" if self.alias else "",
                comment=("-- {}".format(self.comment.replace("\n", "")) if comment and self.comment else ""),
            )

        return query

    def set_table(self, schema, table):
        if self.kind:
            raise ValueError("Cannot set a table twice")

        if Table is None:
            raise ValueError("Schema and table must be present")

        self.kind = "table"
        self.schema = schema
        self.table = table

    def set_temp_table(self, table):
        if self.kind:
            raise ValueError("Cannot set a table twice")

        if table is None:
            raise ValueError("tempt table cannot be None")

        self.kind = "temp_table"
        self.temp_table = table

    def set_cte(self, cte_name):
        if self.kind:
            raise ValueError("Cannot set a table twice")

        if cte_name is None:
            raise ValueError("CTE must exists")

        self.kind = "cte"
        self.cte = cte_name

    def set_query(self, query):
        if self.kind:
            raise ValueError("Cannot set a table twice")

        if not isinstance(query, Query):
            raise TypeError("Invalid type for Query")

        self.kind = "query"
        self.query = query

    def remove_order(self):
        if self.query:
            self.query.remove_order()

    def set_raw_sql(self, sql_query):
        if self.kind:
            raise ValueError("Cannot set a table twice")

        if sql_query is None or not isinstance(sql_query, str):
            raise TypeError("Invalid type for sql query")

        self.kind = "sql"
        self.sql = unicodedata.normalize("NFKC", sql_query)

    def add_project_id(self, project_id):
        # Add the project id
        self.project_id = project_id


class Join:
    def __init__(self, language=None, json_obj=None, kind="INNER", table=None, condition=None):
        if kind not in ("INNER", "LEFT", "RIGHT", "FULL", "CROSS"):
            raise ValueError("Invalid Join type")

        assert language is not None
        self.language = language

        self.kind = kind
        self.table = None
        self.condition = None

        if table:
            self.add_table(table)

        if condition:
            self.add_condition(condition)

        # parse the json object if available
        if json_obj:
            self.kind = json_obj["kind"]
            self.table = Table(language=self.language, json_obj=json_obj["table"])
            self.condition = Condition(language=self.language, json_obj=json_obj["condition"])

    def to_query(self, tab=0, comment=False, **kwargs):
        query = [f"{self.kind} JOIN {self.table.to_query(tab, comment, **kwargs)}"]
        if self.condition:
            query.append(
                utils.indent(
                    f"ON {self.condition.to_query(tab + 1, comment).lstrip()}",
                    1,
                )
            )
        return "\n".join([utils.indent(q, tab) for q in query])

    def dict(self):
        obj = dict(
            kind=self.kind,
            table=self.table.dict(),
            condition=self.condition.dict(),
        )
        return obj

    def add_table(self, table):
        if not isinstance(table, Table):
            raise TypeError("Query must be a Table Object")

        if self.table:
            raise ValueError("Cannot replace table in join")

        self.table = table

    def add_condition(self, condition):
        if not (isinstance(condition, Condition | Filter)):
            raise TypeError("Query must be a Filter or Condition Object")

        if self.condition:
            raise ValueError("Cannot replace condition in join")
        self.condition = condition

    def remove_order(self):
        if self.table:
            self.table.remove_order()


class Filter:
    def __init__(self, language=None, json_obj=None, filters=None):
        assert language is not None
        self.language = language

        # check if input is valid
        self.filters = filters if filters else []
        self.is_not = False

        # recursively break down the filters
        if json_obj:
            for f in json_obj["filters"]:
                if isinstance(f, dict):
                    if f.get("operator"):
                        self.filters.append(Condition(language=self.language, json_obj=f))
                    else:
                        self.filters.append(Filter(language=self.language, json_obj=f))
                else:
                    self.filters.append(f)

    def to_query(self, tab=0, comment=False):
        if len(self.filters) == 0:
            raise ValueError("Cannot make an empty filter to Query")

        # if it just one filter then make it to query
        elif len(self.filters) == 1 and not self.is_not:
            return self.filters[0].to_query(tab=tab, comment=comment)

        # handle the negation
        if self.is_not:
            query = ["not ( \n"]
        else:
            query = ["( \n"]

        for ii, f in enumerate(self.filters):
            if (ii % 2 == 1) != isinstance(f, str):
                raise ValueError(f"Expected an AND/OR and got {utils.queryify(f)}")

            # deal with the string
            if isinstance(f, str):
                query.append(f" {f}\n")
            else:
                # if it is a filter or a condition then just convert it to a query
                query.append(f.to_query(tab=tab + 1))

        query.append("\n" + utils.indent(")", tab))
        return utils.indent("".join(query), tab)

    def dict(self):
        obj = dict(filters=[_obj_to_dict(f) for f in self.filters])
        return obj

    def add_filter(self, f, kind="AND"):
        if isinstance(f, list):
            for tf in f:
                self.add_filter(tf, kind)
            return None

        if f is None:
            return None

        if not (isinstance(f, Condition | Filter) or (isinstance(f, Column) and f.column_type == "boolean")):
            raise TypeError("Invalid type for filter")

        if kind not in ("AND", "OR"):
            raise ValueError("Invalid type, only support AND OR")

        # check if the filter doesn't exist
        if len(self.filters) > 0:
            # don't add repeat queries that already exist
            if f.to_query() not in (tf.to_query() for tf in self.filters[::2]):
                self.filters.append(kind)
                self.filters.append(f)
        else:
            self.filters.append(f)

        return None

    def get_dependent_columns(self, just_names=True):
        dependent_list = []
        for f in self.filters:
            if isinstance(f, Condition | Filter | Column):
                utils.extend_list(dependent_list, f.get_dependent_columns(just_names))

        return dependent_list

    def remove_alias(self):
        for f in self.filters:
            if isinstance(f, Condition):
                _remove_column_alias(f.left)
                _remove_column_alias(f.right)
            elif isinstance(f, Filter):
                f.remove_alias()


class Condition:
    def __init__(self, language=None, json_obj=None, operator=None, left=None, right=None):
        assert language is not None
        self.language = language

        if operator and operator not in CONFIG[self.language]["operators"].keys():
            raise ValueError(f"Invalid operator: {operator}. Make sure it is in the config")

        # check all the inputs to make sure there is no sql injections
        for w in [operator, left, right]:
            _check_input(w)

        # HACK TO fix typo
        if operator == "not_contain":
            operator = "not_contains"

        if operator.endswith("equal") and right.kind == "value" and right.value is None:
            operator = operator.replace("equal", "is_null")

        self.operator = operator
        self.left = left
        self.right = right

        if json_obj:
            self.operator = json_obj["operator"]
            self.left = _dict_to_obj(json_obj["left"], language=self.language, desired_type=Column)
            self.right = _dict_to_obj(json_obj["right"], language=self.language, desired_type=Column)

        # ensure both right and left are castied
        if isinstance(self.right, Column) and self.right.kind == "value" and self.right.casting == "date":
            self.left.casting = "date"

        # Force types to be typed
        if (
            isinstance(self.left, Column)
            and isinstance(self.right, Column)
            and self.right.kind == "value"
            and self.right.casting is None
        ):
            self.right.casting = self.left.get_type()

        # handle lowring the operations
        if operator in LOWER_OPERATORS:
            if isinstance(self.right, Column) and self.right.kind == "value" and isinstance(self.right.value, str):
                self.right.value = self.right.value.lower()
            if isinstance(self.right, list):
                for r in self.right:
                    if isinstance(r, Column) and r.kind == "value" and isinstance(r.value, str):
                        r.value = r.value.lower()

        # deal with the type
        operator_details = next((f for f in FUNCTIONS if f["name"] == self.operator), dict())
        for io in operator_details.get("input_fields") or []:
            if io["name"] == "left" and isinstance(self.left, Column):
                self.left.allowed_types = io["data"]
            elif io["name"] == "right" and isinstance(self.right, Column):
                self.right.allowed_types = io["data"]

    def to_query(self, tab=0, comment=False, is_set=False):
        # deal with casting if big Query
        if not is_set and isinstance(self.left, Column) and isinstance(self.right, Column):
            if self.language == "bigquery" and utils.get_simple_type(self.left.column_type) != utils.get_simple_type(
                self.right.column_type
            ):
                if self.left.column_type is None:
                    self.left.casting = self.right.column_type
                elif self.right.column_type is None:
                    self.right.casting = self.left.column_type

            # handle Equal to NULL which breaks in bigquery
            if self.operator.endswith("equal") and self.right.kind in (None, "value") and self.right.value is None:
                self.operator = self.operator.replace("equal", "is_null")

        # handle edge chase where we do in (Subquery)
        if isinstance(self.right, Table):
            self.right.alias = None

        # don't use is_in if it is just one
        if isinstance(self.right, list) and len(self.right) == 1 and self.operator in ("is_in", "not_is_in"):
            self.right = self.right[0]
            self.operator = self.operator.replace("is_in", "equal")

        # handle the case when the right is a list# don't use is_in if it is just one
        if self.operator == "equal" and self.right and self.right.kind == "value" and self.right.value is None:
            self.operator = "is_null"

        # add the parens
        if isinstance(self.right, Query) and self.operator in ("equal"):
            right = f"({utils.queryify(self.right, tab=0)})"
        else:
            right = utils.queryify(self.right, tab=0)

        # Deal with he value
        query = CONFIG[self.language]["operators"][self.operator].format(
            left=utils.queryify(self.left, tab=0),
            left_value=(utils.queryify(self.left.value) if isinstance(self.left, Column) else None),
            right=right,
            right_value=(utils.queryify(self.right.value) if isinstance(self.right, Column) else None),
        )
        return utils.indent(query, tab)

    def dict(self):
        obj = dict(
            operator=self.operator,
            left=_obj_to_dict(self.left),
            right=_obj_to_dict(self.right),
        )
        return obj

    def get_dependent_columns(self, just_names=True):
        dependent_list = []

        if self.left:
            utils.extend_list(dependent_list, self.left.get_dependent_columns(just_names))

        if self.right:
            if isinstance(self.right, list):
                for r in self.right:
                    utils.extend_list(dependent_list, r.get_dependent_columns(just_names))
            else:
                utils.extend_list(dependent_list, self.right.get_dependent_columns(just_names))

        return dependent_list


class Column:
    def __init__(
        self,
        language=None,
        use_boundary=False,
        week_day_offset=0,
        json_obj=None,
        components=None,
        table_alias=None,
        table_column=None,
        json_column=None,
        json_key=None,
        case=None,
        function=None,
        fields=None,
        value=None,
        condition=None,
        all_columns=False,
        name_alias=None,
        casting=None,
        timezone=None,
        comment=None,
        column_type=None,
        _skip_date_check=False,
    ):
        assert language is not None
        self.language = language

        self.components = None  # a list of columns and operators

        # controls the kind 'simple', 'compound', 'function', 'all', 'value', 'json'
        self.kind = None

        # if simple reference
        self.table_alias = None
        self.table_column = None
        self.allowed_types = ALL_TYPES

        # if simple reference
        self.json_column = None
        self.json_key = None

        # to handle case when function
        self.case = None

        # if function
        self.function = None
        self.fields = None

        # if condition
        self.condition = None

        # if string
        self.value = None

        self.count = 0
        self.timezone = None
        self.name_alias = None
        self.casting = None
        self.comment = comment
        self.use_boundary = use_boundary

        # add a cleaned up version of the column type
        self.column_type = utils.get_simple_type(column_type) if column_type else None

        # check all the inputs to make sure there is no sql injections
        for w in [
            value,
            casting,
            function,
            table_alias,
            case,
            table_column,
            name_alias,
            timezone,
        ]:
            _check_input(w)

        # set the proper fields
        if casting:
            self.set_casting(casting)

        if timezone:
            self.set_timezone(timezone)

        if name_alias and (table_column != name_alias or casting is not None or timezone is not None):
            self.set_name_alias(name_alias)

        if all_columns:
            self.kind = "all"
            self.set_table_alias(table_alias)
        else:
            # added the table
            if table_column:
                self.set_simple_column(table_column, table_alias)

            # added the table
            if json_column:
                self.set_json_column(json_column, json_key, table_alias)

            # added the functions
            elif function:
                for _, val in (fields or {}).items():
                    _check_input(val)

                function = function.lower()
                if function.startswith("date"):
                    if self.use_boundary and not function.endswith("_boundary"):
                        function = f"{function}_boundary"

                    if function in (
                        "date_diff",
                        "date_add",
                        "date_to_now",
                    ) and fields.get("datepart") in (
                        "second",
                        "minute",
                        "hour",
                        "day",
                    ):
                        function = function.replace("date", "time")

                    if (
                        function == "date_trunc"
                        and fields.get("datepart") == "week"
                        and week_day_offset
                        and not _skip_date_check
                    ):
                        col = Column(
                            language=self.language,
                            function=function,
                            fields=fields,
                            _skip_date_check=True,
                        )
                        function = "date_add"
                        fields = dict(
                            datepart="day",
                            number=week_day_offset,
                            column=col,
                        )

                self.set_function_column(function, fields)

            # add the value
            elif value is not None:
                self.set_value(value)

            elif case:
                self.set_case(case)

            elif condition:
                self.set_condition(condition)

            # handle components
            elif components:
                for c in components:
                    self.add_component(c)

        if json_obj:
            # add the appropriate column type
            for c in json_obj.get("components") or []:
                self.add_component(_dict_to_obj(c, language=self.language, desired_type=Column))

            self.kind = json_obj.get("kind")

            # if simple reference
            self.table_alias = json_obj.get("table_alias")
            self.table_column = json_obj.get("table_column")

            # if json reference
            self.json_column = json_obj.get("json_column")
            self.json_key = json_obj.get("json_key")

            # if the column is a condition column
            self.condition = _dict_to_obj(
                json_obj.get("condition"),
                language=self.language,
                desired_type=Condition,
            )
            # if function
            self.function = json_obj.get("function")
            self.fields = (
                {k: _dict_to_obj(f, language=self.language, desired_type=Column) for k, f in json_obj["fields"].items()}
                if json_obj.get("fields")
                else None
            )

            self.case = (
                dict(
                    cases=[
                        dict(
                            when=_dict_to_obj(c["when"], language=self.language),
                            then=_dict_to_obj(c["then"], language=self.language, desired_type=Column),
                        )
                        for c in json_obj["case"]["cases"]
                    ],
                    else_value=_dict_to_obj(
                        json_obj["case"].get("else_value"),
                        language=self.language,
                        desired_type=Column,
                    ),
                )
                if json_obj.get("case")
                else None
            )

            # if string
            self.value = json_obj.get("value")

            self.count = json_obj.get("count") or 0
            self.timezone = json_obj.get("timezone")
            self.name_alias = json_obj.get("name_alias")
            self.casting = json_obj.get("casting")
            self.comment = json_obj.get("comment")
            self.column_type = json_obj.get("column_type")

    def to_query(self, tab=0, comment=False, is_first=True, with_alias=False):
        """
        converts the column to the query
        """
        query = []

        # turn all the components into queries
        if self.kind == "components":
            query.append("(")
            for c in self.components:
                query.append(utils.queryify(c))
            query.append(")")

        elif self.kind == "all":
            if self.table_alias:
                query.append(f"{self.table_alias}.*")

            else:
                query.append("*")

        elif self.kind == "function":
            # add another field just in case you need the date seconds for time
            if "datepart" in self.fields.keys():
                # fixed the bug with 's'
                if self.fields["datepart"].endswith("s"):
                    self.fields["datepart"] = self.fields["datepart"][:-1]
                self.fields["DATE_SECONDS"] = DATE_SECONDS.get(self.fields["datepart"])

            # if MSSQL and no features, then make it an empty string
            if self.function == "to_json" and self.language == "mssql_odbc" and not self.fields.get("value_as_key"):
                query.append("'{}'")
            else:
                # create the function
                query.append(
                    CONFIG[self.language]["functions"][self.function].format(
                        **{k: self._single_line(utils.queryify(c)) for k, c in self.fields.items()}
                    )
                )

        elif self.kind == "agg_function":
            # create the function
            query.append(
                CONFIG[self.language]["agg_functions"][self.function].format(
                    **{k: self._single_line(utils.queryify(c)) for k, c in self.fields.items()}
                )
            )

        elif self.kind == "operator":
            # create the function
            query.append(
                CONFIG[self.language]["operators"][self.function].format(
                    **{k: self._single_line(utils.queryify(c)) for k, c in self.fields.items()}
                )
            )

        elif self.kind == "condition":
            query.append(utils.queryify(self.condition))

        elif self.kind == "simple":
            if self.table_alias:
                query.append(
                    "{}{}".format(
                        self.table_alias + "." if self.table_alias else "",
                        fix_reserved_column(self.language, self.table_column),
                    )
                )
            else:
                query.append(fix_reserved_column(self.language, self.table_column))

        elif self.kind == "json":
            # all json should be casted
            if self.column_type == "timestamp":
                self.casting = "timestamp"

            query.append(
                CONFIG[self.language]["json_structure"].format(
                    column=(f"{self.table_alias}.{self.json_column}" if self.table_alias else self.json_column),
                    key=self.json_key,
                )
            )

            # add to remove the "" from redshift
            if self.language == "redshift" and self.column_type == "timestamp":
                temp_type = "string"
            else:
                temp_type = self.column_type

            # handle json kinds
            if (
                temp_type
                and temp_type != "timestamp"
                and not (self.casting == "string" and temp_type == "number" and self.language != "redshift")
                and not (
                    (self.language == "bigquery" and temp_type == "string")
                    or self.language in ("mssql_odbc", "pg", "databricks")
                    or (self.language == "redshift" and temp_type in ("number"))
                )
            ):
                query = [
                    CONFIG[self.language]["cast_mapping"]["structure"].format(
                        cast=CONFIG[self.language]["cast_mapping"][temp_type],
                        definition=" ".join(query),
                    )
                ]

        # add the value they are putting
        elif self.kind == "value":
            if isinstance(self.value, list):
                query.append(", ".join(self.value_format(self.value)))
            else:
                query.append(self.value_format(self.value))

        elif self.kind == "case":
            query.append("CASE\n")
            for c in self.case["cases"]:
                # check for inputes
                for _, val in c.items():
                    _check_input(val)

                # add the when statement
                query.append(
                    utils.indent(
                        "WHEN " + " ".join([c.lstrip() for c in utils.queryify(c["when"]).split("\n")]),
                        tab + 3,
                    )
                )

                # add the then
                query.append("THEN ")
                query.append(utils.queryify(c["then"]).lstrip())
                query.append("\n")

            # add the else value
            if self.case.get("else_value"):
                _check_input(self.case["else_value"])
                query.append(utils.indent("ELSE ", tab + 3))
                query.append(utils.queryify(self.case["else_value"]))
                query.append("\n")

            # add the end
            query.append(utils.indent("END", tab + 2))

            # clean up the line if it just one case
            if len(self.case["cases"]) == 1:
                query = [self._single_line(" ".join(query))]

        else:
            query.append("NULL")

        # deal with casting
        if self.casting:
            if (
                self.column_type == "json"
                and self.casting in ("string", "text")
                and self.language in ("bigquery", "redshift")
            ):
                if self.language == "bigquery":
                    query = [
                        "TO_JSON_STRING({definition})".format(
                            definition=" ".join(query),
                        )
                    ]
                else:
                    query = [
                        "JSON_SERIALIZE({definition})".format(
                            definition=" ".join(query),
                        )
                    ]

            elif self.kind == "value":
                if self.casting == "boolean":
                    query = [str(str(self.value).lower() == "true")]
                elif self.casting == "string":
                    query = [
                        "{q}{d}{q}".format(
                            q=CONFIG[self.language]["value_quotes"],
                            d=str(self.value),
                        )
                    ]
                elif utils.get_simple_type(self.casting) == "number":
                    query = [str(self.value)]

                # deal with timestamp
                else:
                    query = [
                        CONFIG[self.language]["cast_mapping"]["structure"].format(
                            cast=CONFIG[self.language]["cast_mapping"][self.casting],
                            definition="{q}{d}{q}".format(
                                q=CONFIG[self.language]["value_quotes"],
                                d=str(self.value),
                            ),
                        )
                    ]

            elif self.column_type == "boolean" and self.casting == "string":
                # if it is a value then don't worry to much about it
                query = [
                    "CASE WHEN {definition} is null then {q}{q} WHEN {definition} THEN {q}true{q} ELSE {q}false{q} END".format(
                        definition=" ".join(query),
                        q=CONFIG[self.language]["value_quotes"],
                    )
                ]
            elif self.casting == "boolean" and self.column_type == "string":
                query = [
                    "CASE WHEN {definition} in (NULL, '') THEN NULL ELSE (LOWER({definition}) = {q}true{q}) END".format(
                        definition=" ".join(query),
                        q=CONFIG[self.language]["value_quotes"],
                    )
                ]
            elif (
                self.column_type in ("string", "text", None)
                and self.casting == "string"
                and self.language in ("snowflake")
            ):
                query = ["LEFT({definition}, 253)".format(definition=" ".join(query))]

            else:
                query = [
                    CONFIG[self.language]["cast_mapping"]["structure"].format(
                        cast=CONFIG[self.language]["cast_mapping"][self.casting],
                        definition=" ".join(query),
                    )
                ]

        # deal with timezones
        if self.timezone and self.timezone.lower() != "utc" and (self.get_type() in (None, "timestamp")):
            if self.language == "mssql_odbc":
                offset = datetime.now(pytz.timezone(self.timezone)).strftime("%z")
                tz = MSSQL_TIMEZONE_MAPPING[offset]
            else:
                tz = self.timezone

            query = [
                CONFIG[self.language]["timezone_structure"].format(
                    timezone=tz,
                    definition=" ".join(query),
                )
            ]

        # Add the comma
        if not is_first:
            query.insert(0, ",")

        # add the counts
        name_alias = self.name_alias

        # create a name alias of the columns have the same name
        if self.count > 0:
            name_alias = self.get_name()

        # add the aliasing
        if with_alias and name_alias:
            query.append(f"AS {column_format(self.language, name_alias)}")

        if comment and self.comment is not None:
            query.append(" -- ")
            query.append(self.comment)

        return utils.indent(" ".join(query), tab)

    def dict(self):
        obj = dict(
            components=([_obj_to_dict(c) for c in self.components] if self.components else None),
            kind=self.kind,
            table_alias=self.table_alias,
            table_column=self.table_column,
            json_column=self.json_column,
            json_key=self.json_key,
            function=self.function,
            condition=_obj_to_dict(self.condition),
            fields=({k: _obj_to_dict(f) for k, f in self.fields.items()} if self.fields else None),
            case=(
                dict(
                    cases=[
                        dict(when=_obj_to_dict(c["when"]), then=_obj_to_dict(c["then"])) for c in self.case["cases"]
                    ],
                    else_value=_obj_to_dict(self.case.get("else_value")),
                )
                if self.case
                else None
            ),
            # if string
            value=self.value,
            count=self.count,
            timezone=self.timezone,
            name_alias=self.name_alias,
            casting=self.casting,
            comment=self.comment,
            column_type=self.column_type,
            allowed_types=self.allowed_types,
            use_boundary=self.use_boundary,
        )
        obj = {k: v for k, v in obj.items() if v is not None}
        return obj

    def is_null(self):
        return self.kind == "value" and self.value is None

    def set_table_alias(self, table_alias, no_slug=False):
        if table_alias is None:
            self.table_alias = None
        elif no_slug:
            self.table_alias = table_alias
        else:
            self.table_alias = utils.slugify(table_alias.strip())

    def set_simple_column(self, table_column, table_alias=None):
        if table_column is None:
            raise ValueError("column cannot be None")

        if self.kind:
            raise ValueError("Cannot change column kind")

        self.kind = "simple"
        self.table_column = table_column
        self.set_table_alias(utils.slugify(table_alias))

    def set_json_column(self, json_column, json_key, table_alias):
        if json_column is None or json_key is None:
            raise ValueError("JSON column and key cannot be None")

        if self.kind:
            raise ValueError("Cannot change column kind")

        self.kind = "json"
        self.json_column = json_column
        self.json_key = utils.fix_key(json_key)
        self.set_table_alias(utils.slugify(table_alias))

    def set_condition(self, condition):
        if condition is None:
            raise ValueError("column cannot be None")

        if self.kind:
            raise ValueError("Cannot change column kind")

        if not (isinstance(condition, Condition | Filter)):
            raise ValueError("Condition needs to be column of type Condition or Filter")

        self.kind = "condition"
        self.condition = condition
        self.column_type = "boolean"

    def set_function_column(self, function, fields):
        if self.kind:
            raise ValueError("Cannot change column kind")

        not_valid = True
        for kind in ("functions", "agg_functions", "operators"):
            if function in CONFIG[self.language][kind].keys():
                not_valid = False
                break

        if not_valid:
            raise ValueError(f"Function {function} not supported")

        # get all the required fields
        missing_fields = [
            c
            for c in utils.get_required_fields(CONFIG[self.language][kind][function])
            if c not in fields.keys() and c != c.upper()
        ]

        if len(missing_fields) > 0:
            raise (
                ValueError(
                    "Function {} requires the following fields that were not provided {}".format(
                        function, ", ".join(missing_fields)
                    )
                )
            )

        # check to see any column and make sure we have the input
        function_details = next((f for f in FUNCTIONS if f["name"] == function), dict())
        for tf in function_details.get("input_fields") or []:
            if tf["kind"] == "column" and isinstance(fields.get(tf["name"]), Column):
                fields[tf["name"]].allowed_types = tf["data"]
                # TODO: Add check
                # if fields[tf["name"]] and fields[tf["name"]].get_type() not in fields[tf["name"]].allowed_types:
                #     raise( "Invalid type")

        # deal with bigquery bing stupid
        if self.language == "bigquery" and fields and fields.get("group"):
            # fix the group because it should be a list
            if not isinstance(fields["group"], list):
                fields["group"] = [fields["group"]]

            for c in fields["group"]:
                if isinstance(c, Column):
                    c.casting = c.casting if c.column_type != "number" else "string"

        self.kind = kind[:-1]
        self.function = function
        self.fields = fields
        if function_details["output_type"] != "column":
            self.column_type = function_details["output_type"]
        else:
            self.column_type = next(
                (c.column_type for _, c in fields.items() if isinstance(c, Column)),
                "string",
            )

    def set_case(self, case):
        if "cases" not in case.keys():
            raise (KeyError("Missing cases from case column"))

        col_type = None
        for c in case["cases"]:
            # validate the case function
            if not (isinstance(c["when"], Column | Condition | Filter)):
                raise TypeError("Invalid case type for the case statement")

            # validate that all the then are columns or case statements
            if not (isinstance(c["then"], Column | str)):
                raise TypeError("Invalid case type for the case statement")

            if isinstance(c["then"], Column):
                col_type = col_type or c["then"].get_type()

        # if your setting a case when to another case when then stich them together
        if case.get("else_value") is not None and case["else_value"].kind == "case":
            case["cases"].extend(case["else_value"].case["cases"])
            case["else_value"] = case["else_value"].case["else_value"]

        if isinstance(case.get("else_value"), Column):
            col_type = col_type or case["else_value"].get_type()

        # add the kind for case
        self.kind = "case"
        self.case = case
        self.column_type = col_type

    def set_value(self, value):
        if self.kind:
            raise ValueError("Cannot change column kind")

        if isinstance(value, str):
            value = utils.replace_quotes(value)

        self.kind = "value"
        self.value = value

        # handle the value of the type
        if self.get_type() == "timestamp" and self.value:
            if "+" in self.value:
                self.value = self.value.split("+")[0]

            if BLANK_TS in str(self.value) or len(value) == 10:
                self.casting = "date"
                self.column_type = "date"
                self.value = self.value[:10]

            # sql server cannot do more than 3 millisecond
            if self.language == "mssql_odbc":
                self.value = self.value[:23]

    def set_name_alias(self, name):
        if self.kind == "all":
            raise ValueError("Cannot add a name on an all column")
        if name:
            # handle removing the quotes
            self.name_alias = clean_column_name(name)

    def add_component(self, component):
        if self.kind and self.kind != "components":
            raise ValueError("Cannot change column kind")

        # if there is a component then make it an array
        if self.components is None:
            self.components = []

        if isinstance(component, str):
            # check if it the first component
            if len(self.components) == 0:
                raise ValueError("Cannot start column with an operation")

            # check if it back to back
            elif len(self.components) > 1 and isinstance(self.components[-1], str):
                raise (
                    ValueError(
                        "Cannot put two operations next to each other: {} {}".format(
                            utils.queryify(self.components[-1]),
                            utils.queryify(component),
                        )
                    )
                )

            # check if it is a valid operation
            elif component not in OPERATIONS:
                raise ValueError(f"Invalid Operation {component}")

            self.kind = "components"
            self.column_type = "number"
            self.components.append(component)

        elif isinstance(component, Column):
            # check if it back to back
            if len(self.components) > 1 and isinstance(self.components[-1], Column):
                raise (
                    ValueError(
                        "Cannot put two columns next to each other: {} {}".format(
                            utils.queryify(self.components[-1]),
                            utils.queryify(component),
                        )
                    )
                )

            # cannot use non number components
            component.allowed_type = ["number"]
            self.kind = "components"
            self.components.append(component)
        else:
            raise TypeError(f"Invalid column type in the components: {str(component)}")

    def set_timezone(self, timezone):
        if self.kind == "all":
            raise ValueError("Cannot add a timezone on an all column")

        if timezone == "local":
            timezone = "{local_timezone}"

        self.timezone = timezone

    def set_casting(self, kind):
        if self.kind == "all":
            raise ValueError("Cannot add a casting on an all column")

        if kind not in CONFIG[self.language]["cast_mapping"].keys():
            raise TypeError(f"not a valid type for casting: {kind}")

        # added timestamp because timezone should be casted and doesn't understand timezone
        if self.column_type is None or self.column_type != kind or kind == "timestamp":
            self.casting = kind
        else:
            self.casting = None

    def get_type(self):
        return self.casting or self.column_type

    def get_name(self, no_count=False):
        """
        returns the column name used in the table
        """
        if self.name_alias:
            name = self.name_alias

        elif self.kind == "components":
            name = self.components[0].get_name()

        elif self.kind == "simple":
            name = self.table_column

        elif self.kind == "function":
            name = self.function

        elif self.kind == "value":
            name = "column"

        if no_count or self.count == 0:
            return utils.slugify(name)
        else:
            return f"{utils.slugify(name)}_{self.count}"

    def set_count(self, count):
        self.count = count

    def is_all(self):
        return self.kind == "all"

    def get_table(self):
        if self.kind in ("simple", "all"):
            return self.table_alias

        return None

    @staticmethod
    def __check_type(c):
        return isinstance(c, Column | Condition | Filter | Order)

    def get_dependent_columns(self, just_names=True):
        dependent_columns = []
        if self.kind == "components":
            for c in self.components:
                if self.__check_type(c):
                    utils.extend_list(dependent_columns, c.get_dependent_columns(just_names))

        elif self.kind == "simple":
            utils.extend_list(dependent_columns, self.table_column if just_names else self)

        elif self.kind in ("function", "agg_functions", "operator"):
            for _k, c in self.fields.items():
                if not isinstance(c, list):
                    c = [c]

                for ec in c:
                    if self.__check_type(ec):
                        utils.extend_list(dependent_columns, ec.get_dependent_columns(just_names))

        elif self.kind == "case":
            for c in self.case["cases"]:
                utils.extend_list(dependent_columns, c["when"].get_dependent_columns(just_names))
                utils.extend_list(dependent_columns, c["then"].get_dependent_columns(just_names))

            if self.case.get("else_value"):
                utils.extend_list(
                    dependent_columns,
                    self.case["else_value"].get_dependent_columns(just_names),
                )

        return dependent_columns

    @staticmethod
    def _single_line(s):
        if s == " ":
            return s
        else:
            return " ".join(s.split())

    def value_format(self, string: str):
        """
        value_FORMAT: adds the proper quotes to a string name
        """
        # handle objects
        if isinstance(string, list):
            return [self.value_format(s) for s in string]

        if isinstance(string, float | int):
            return str(string)

        _check_input(string)

        formatted_string = "{quotes}{word}{quotes}".format(quotes=CONFIG[self.language]["value_quotes"], word=string)
        return formatted_string


class Order:
    def __init__(self, language=None, json_obj=None, column=None, asc=True, raw_column=None):
        assert language is not None
        self.language = language

        for c in [column, raw_column]:
            _check_input(c)

        # check if input is valid
        self.column = column
        self.asc = asc
        self.raw_column = raw_column

        # recursively break down the filters
        if json_obj:
            self.column = Column(json_obj=json_obj.get("column"))
            self.asc = json_obj.get("asc")
            self.raw_column = json_obj.obj.get("raw_column")

        if self.column is None and self.raw_column is None:
            raise ValueError("Cannot have an order without a column")

        if self.raw_column:
            Warning("raw_column is deprecated!")  # noqa: PLW0133

    def to_query(self, tab=0, comment=False):
        if self.raw_column:
            query = self.raw_column
        else:
            query = "{col} {dirc}".format(
                col=self.column.to_query(),
                dirc="ASC" if self.asc else "DESC",
            )
        return utils.indent(query, tab)

    def dict(self):
        obj = dict(column=_obj_to_dict(self.column), asc=self.asc, raw_column=self.raw_column)
        return obj

    def get_dependent_columns(self, just_names=True):
        dependent_list = []
        utils.extend_list(dependent_list, self.column.get_dependent_columns(just_names))
        return dependent_list


#
# QueryMapper helpers
#


def column_format(language: str, string: str):
    """
    column_FORMAT: adds the proper quotes to a string name
    """
    # handle objects
    if isinstance(string, list):
        return [column_format(s) for s in string]

    if isinstance(string, int):
        return str(string)

    # handle it because snowflake needs the column to be wrapped
    if language in ("mysql"):
        return string
    elif string in CONFIG[language]["reserved_words"]:
        return "{quotes}{word}{quotes}".format(quotes=CONFIG[language]["column_quotes"], word=string)
    elif language == "bigquery":
        return string
    else:
        return "{quotes}{word}{quotes}".format(quotes=CONFIG[language]["column_quotes"], word=string)


def _check_input(col_name):
    # check for any sql injections
    if isinstance(col_name, str) and ";" in col_name:
        raise ValueError(f"Invalid String with possible SQL injection - {col_name}")

    return col_name


def fix_reserved_column(language, col_name, column_type=None):
    """
    Checks if a column uses a reserved word and put it in column quotes
    """

    if not language:
        raise ValueError("Missing language")
    if not CONFIG.get(language):
        raise ValueError(f"Missing config for language {language}")

    if language == "bigquery" and any(k in col_name for k in ("*", " ")):
        col_name = f"`{col_name}`"

    elif (
        col_name in CONFIG[language]["reserved_words"]
        or (col_name != "" and col_name[0].isdigit())
        or any(a in col_name for a in [" ", "-", ".", "$"])
    ):
        col_name = "{quote}{col}{quote}".format(
            col=col_name.upper() if language == "snowflake" else col_name, quote=CONFIG[language]["column_quotes"]
        )

    if column_type == "datetimeoffset":
        col_name += " -- Is Datetime offset"

    return col_name


def clean_column_name(name):
    if not isinstance(name, str):
        name = f"a {name}"
    # handle the name
    # add a name if it is an empty string
    if len(name) == 0:
        name = "temp"

    # handle first digit being a number
    if name[0].isdigit():
        name = "a " + name

    # truncate the name (we use a UUIDStr to guarantee the truncated name is unique)
    if len(name) > 120:
        name = name[:110] + name[-10:]

    # handle removing the quotes
    return utils.slugify(utils.remove_quotes(name))


def _dict_to_obj(obj, language=None, desired_type=None):
    if isinstance(obj, dict):
        if desired_type:
            return desired_type(language=language, json_obj=obj)
        elif obj.get("operator"):
            return Condition(language=language, json_obj=obj)
        elif obj.get("filters"):
            return Filter(language=language, json_obj=obj)
        else:
            return Column(language=language, json_obj=obj)
    else:
        return obj


def _obj_to_dict(obj, **kwargs):
    if obj is None:
        return None
    elif isinstance(obj, list):
        return [_obj_to_dict(o) for o in obj]
    elif isinstance(obj, Column | Condition | Filter | Join | Query | Table):
        return obj.dict(**kwargs)
    else:
        return obj
