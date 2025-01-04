SUPPORTED_FUNC = [
    dict(
        label="human_format(",
        insertText="human_format(${1:value}, '${2:kind_to_format}')",
        documentation=dict(
            value="\n\n".join(
                [
                    "## Human Format",
                    "Formats the data to be in  pretty way",
                    "<br>",
                    "## Inputs",
                    "1. **Value:** The number, text, or variable you want to format",
                    "2. **Kind of format:** Either 'number', 'text', 'table', 'revenue', 'conversion', '#', 's', '%', '$'",
                    "<br>",
                    "### Examples",
                    " - {human_format(343433, '$')} → $344k",
                ]
            )
        ),
        detail="Formatting Text",
        kind=2,
        is_mavis=True,
    ),
    dict(
        label="hf(",
        insertText="hf(${1:value}, ${2:format_variable})",
        documentation=dict(
            value="\n\n".join(
                [
                    "## hf",
                    "Formats the data to be in  pretty way",
                    "**note**: This is just the short hand of human_format",
                    "<br>",
                    "## Inputs",
                    "1. **Value:** The number, text, or variable you want to format",
                    "2. **Kind of format:** Either 'number', 'text', 'table', 'revenue', 'conversion', '#', 's', '%', '$'",
                    "<br>",
                    "### Examples",
                    " - {human_format(343433, '$')} → $344k",
                ]
            )
        ),
        detail="Formatting Text",
        kind=2,
    ),
    dict(
        label="guess_format(",
        insertText="guess_format('${1:column_name}', '${2:column_type}')",
        documentation=dict(
            value="\n\n".join(
                [
                    "## guess_format",
                    "Uses the column name and type to guess the format of the column",
                    "<br>",
                    "## Inputs",
                    "1. **Column_name:** the name of the column",
                    "2. **Column_type:** Either 'number', 'string'",
                    "<br>",
                    "### Examples",
                    " - `{guess_format('total ltv', 'number')}` → 'revenue'",
                    " - `{guess_format('Email rate', 'number')}` → 'percent'",
                    " - `{hf(0.125, guess_format('percent called', 'number'))}` → 12.5%",
                ]
            )
        ),
        detail="Formatting Text",
        kind=2,
    ),
    dict(
        label="pluralize(",
        insertText="pluralize(${1:number}, '${2:string_value}')",
        documentation=dict(
            value="\n\n".join(
                [
                    "## pluralize",
                    "Update a word to be the plural or singular",
                    "<br>",
                    "## Inputs",
                    "1. **number:** the numeric count",
                    "2. **string_value:** The word",
                    "<br>",
                    "### Examples",
                    " - `{pluralize(2, 'order')}` → 'orders'",
                    " - `{pluralize(1, 'order')}` → 'order'",
                ]
            )
        ),
        detail="Formatting Text",
        kind=2,
    ),
    dict(
        label="plural(",
        insertText="plural(${1:string_value})",
        documentation=dict(
            value="\n\n".join(
                [
                    "## plural",
                    "Update a word to be the plural",
                    "<br>",
                    "## Inputs",
                    "1. **number:** the numeric count",
                    "2. **string_value:** The word",
                    "<br>",
                    "### Examples",
                    " - `{plural('order')}` → 'orders'",
                    " - `{plural('call')}` → 'calls'",
                ]
            )
        ),
        detail="Formatting Text",
        kind=2,
    ),
    dict(
        label="singular(",
        insertText="singular(${1:string_value})",
        documentation=dict(
            value="\n\n".join(
                [
                    "## singular",
                    "Update a word to be the singular",
                    "<br>",
                    "## Inputs",
                    "1. **number:** the numeric count",
                    "2. **string_value:** The word",
                    "<br>",
                    "### Examples",
                    " - `{singular('order')}` → 'order'",
                    " - `{singular('calls')}` → 'call'",
                ]
            )
        ),
        detail="Formatting Text",
        kind=2,
    ),
    dict(
        label="hf_date_diff(",
        insertText="hf_date_diff(${1:from_date}, ${2:to_date})",
        documentation=dict(
            value="\n\n".join(
                [
                    "## hf_date_diff",
                    "displays the ",
                    "<br>",
                    "## Inputs",
                    "1. **from_date:** the from date",
                    "2. **to_date:** The to date",
                    "<br>",
                    "### Examples",
                    " - `{hf_date_diff(last_month, now())}` → '1 month ago'",
                ]
            )
        ),
        detail="Formatting Text",
        kind=2,
    ),
    # DATA MANIPULATION
    dict(
        label="date_add(",
        insertText="date_add(${1:date}, '${2:datepart}', ${3:number})",
        documentation=dict(
            value="\n\n".join(
                [
                    "## date_add",
                    "Adds an interval of time/date to a date",
                    "**note** you can use default fields like (today, this_month, last_month, etc..)" "<br>",
                    "## Inputs",
                    "1. **date:** the date you want to manipulate",
                    "2. **datepart:** Either 'minute', 'hour', 'day', 'week', 'month', 'quarter', 'year'",
                    "<br>",
                    "### Examples",
                    " - `{date_add(last_month, 'day', 2)}` → 3 of the last month",
                    " - `{date_add(now(), 'hour', -3)}` →  3 hours ago",
                    " - `{date_add(date_add(this_month, 'month', 1), 'day', -1)}` → last day of month",
                ]
            )
        ),
        detail="Date Manipulation",
        kind=2,
        is_mavis=True,
    ),
    dict(
        label="date_trunc(",
        insertText="date_trunc(${1:date}, '${2:datepart}')",
        documentation=dict(
            value="\n\n".join(
                [
                    "## date_trunc",
                    "Truncates to the start of the date part",
                    "**note** you can use default fields like (today, this_month, last_month, etc..)" "<br>",
                    "## Inputs",
                    "1. **date:** the date you want to manipulate",
                    "2. **datepart:** Either 'minute', 'hour', 'day', 'week', 'month', 'quarter', 'year'",
                    "<br>",
                    "### Examples",
                    " - `{date_trunc(today, 'month')}` → start of this month",
                    " - `{date_trunc(now(), 'hour')}` →  the start of the hour",
                    " - `{date_add(date_trunc(now(), 'month'), 'day', -1)}` → last day of last month",
                ]
            )
        ),
        detail="Date Manipulation",
        kind=2,
        is_mavis=True,
    ),
    dict(
        label="date_diff(",
        insertText="date_diff(${1:from_date}, ${2:to_date}, '${3:datepart}')",
        documentation=dict(
            value="\n\n".join(
                [
                    "## date_diff",
                    "Get an internval between to date",
                    "**note** you can use default fields like (today, this_month, last_month, etc..)" "<br>",
                    "## Inputs",
                    "1. **from_date:** The initial date",
                    "2. **to_date:** the final date",
                    "3. **datepart:** Either 'minute', 'hour', 'day', 'week', 'month', 'quarter', 'year'",
                    "<br>",
                    "### Examples",
                    " - `{date_diff(this_month, today, 'day')}` → days since BOM",
                    " - `{date_diff(COL, now(), 'hour')}` →  hours from a column",
                ]
            )
        ),
        detail="Date Manipulation",
        kind=2,
    ),
    dict(
        label="make_local(",
        insertText="make_local(${1:date_time}, local_tz)",
        documentation=dict(
            value="\n\n".join(
                [
                    "## make_local",
                    "Conversts UTC to company's reporting timezone (set in company settings)",
                    "## Inputs",
                    "1. **date_time:** The initial date",
                    "2. **timezone:** the final date",
                    "<br>",
                    "### Examples",
                    " - `{make_local(now(), local_tz)}` → local time",
                ]
            )
        ),
        detail="Date Manipulation",
        kind=2,
    ),
    # TABLE MANIPULATION
    dict(
        label="get_column_values(",
        insertText="get_column_values(${1:table}, '${2:column_name}')",
        documentation=dict(
            value="\n\n".join(
                [
                    "## get_column_values",
                    "Gets a single column from a table",
                    "## Inputs",
                    "1. **table:** The table object",
                    "2. **column:** The column you want ",
                    "<br>",
                    "### Examples",
                    " - `{get_column_values(some_table, 'total customers')}` → All the values of the total customer column",
                ]
            )
        ),
        detail="Table Manipulation",
        kind=2,
    ),
    dict(
        label="select_columns(",
        insertText="select_columns(${1:table}, ${2:list_of_columns})",
        documentation=dict(
            value="\n\n".join(
                [
                    "## select_columns",
                    "Gives you a table with the only the columns you want ",
                    "## Inputs",
                    "1. **table:** The table object",
                    "2. **list of columns:** The columns you want (ex `['col_1', 'col_2']`) ",
                    "<br>",
                    "### Examples",
                    " - `{select_columns(some_table, ['total customers'])}` → A table with just 2 cols",
                    " - `{hf(select_columns(some_table, ['customer', 'total row']))}` → A pretty table with the 2 cols",
                ]
            )
        ),
        detail="Table Manipulation",
        kind=2,
    ),
    dict(
        label="filter(",
        insertText="filter(${1:table}, ${2:column}, ${3:value}, ${4:return_column})",
        documentation=dict(
            value="\n\n".join(
                [
                    "## filter",
                    "Filter a table for a column with a specific value",
                    "**Note this is like `WHERE column = value` in SQL* " "## Inputs",
                    "1. **table:** The table object",
                    "2. **column:** The columns that is filter",
                    "2. **value:** The value of the filter ",
                    "2. **return_column:** The column you want output",
                    "<br>",
                    "### Examples",
                    " - `{filter(table, feature, 'FEATURE_VALUE', 'total_customers')}` → All the total_customers values where feature = 'FEATURE_VALUE'",
                    " - `{max_values(filter(table, 'gender', 'men', 'ltv'))}` → The maximum LTV for all men genders",
                ]
            )
        ),
        detail="Table Manipulation",
        kind=2,
    ),
    dict(
        label="filter_gt(",
        insertText="filter_gt(${1:table}, ${2:column}, ${3:value}, ${4:return_column})",
        documentation=dict(
            value="\n\n".join(
                [
                    "## filter_gt",
                    "Filter a table for a column with the value **greater than** input",
                    "**Note this is like `WHERE column > value` in SQL* " "## Inputs",
                    "1. **table:** The table object",
                    "2. **column:** The NUMBER columns that is filter",
                    "2. **value:** The value of the filter",
                    "2. **return_column:** The column you want output",
                    "<br>",
                    "### Examples",
                    " - `{filter_gt(table, 'total_customer', 1000 , 'age')}` → All the ages where total_customers is greater than 100",
                    " - `{first_value(filter_gt(table, 'avg_tenure', 5, 'ltv'))}` → The first LTV where the average tenure is greater than 5",
                ]
            )
        ),
        detail="Table Manipulation",
        kind=2,
    ),
    dict(
        label="filter_gte(",
        insertText="filter_gte(${1:table}, ${2:column}, ${3:value}, ${4:return_column})",
        documentation=dict(
            value="\n\n".join(
                [
                    "## filter_gte",
                    "Filter a table for a column with the value **greater than or Equal** input",
                    "**Note this is like `WHERE column >= value` in SQL* " "## Inputs",
                    "1. **table:** The table object",
                    "2. **column:** The NUMBER columns that is filter",
                    "2. **value:** The value of the filter",
                    "2. **return_column:** The column you want output",
                    "<br>",
                    "### Examples",
                    " - `{filter_gte(table, 'total_customer', 1000 , 'age')}` → All the ages where total_customers is greater than or equal to 100",
                    " - `{first_value(filter_gte(table, 'avg_tenure', 5, 'ltv'))}` → The first LTV where the average tenure is greater than or equal 5",
                ]
            )
        ),
        detail="Table Manipulation",
        kind=2,
    ),
    dict(
        label="filter_lt(",
        insertText="filter_lt(${1:table}, ${2:column}, ${3:value}, ${4:return_column})",
        documentation=dict(
            value="\n\n".join(
                [
                    "## filter_lt",
                    "Filter a table for a column with the value **less than or Equal** input",
                    "**Note this is like `WHERE column < value` in SQL* " "## Inputs",
                    "1. **table:** The table object",
                    "2. **column:** The NUMBER columns that is filter",
                    "2. **value:** The value of the filter",
                    "2. **return_column:** The column you want output",
                    "<br>",
                    "### Examples",
                    " - `{filter_lt(table, 'total_customer', 1000 , 'age')}` → All the ages where total_customers is less than  to 100",
                    " - `{first_value(filter_lt(table, 'avg_tenure', 5, 'ltv'))}` → The first LTV where the average tenure is less than 5",
                ]
            )
        ),
        detail="Table Manipulation",
        kind=2,
    ),
    dict(
        label="filter_lte(",
        insertText="filter_lte(${1:table}, ${2:column}, ${3:value}, ${4:return_column})",
        documentation=dict(
            value="\n\n".join(
                [
                    "## filter_lte",
                    "Filter a table for a column with the value **less than or Equal** input",
                    "**Note this is like `WHERE column <= value` in SQL* " "## Inputs",
                    "1. **table:** The table object",
                    "2. **column:** The NUMBER columns that is filter",
                    "2. **value:** The value of the filter",
                    "2. **return_column:** The column you want output",
                    "<br>",
                    "### Examples",
                    " - `{filter_lte(table, 'total_customer', 1000 , 'age')}` → All the ages where total_customers is less than or equal to 100",
                    " - `{first_value(filter_lte(table, 'avg_tenure', 5, 'ltv'))}` → The first LTV where the average tenure is less than or equal 5",
                ]
            )
        ),
        detail="Table Manipulation",
        kind=2,
    ),
    dict(
        label="limit_table(",
        insertText="limit_table(${1:table}, ${2:rows})",
        documentation=dict(
            value="\n\n".join(
                [
                    "## limit_table",
                    "limits a table",
                    "**Note this is like `LIMIT 100` in SQL* " "## Inputs",
                    "1. **table:** The table object",
                    "2. **rows:** The number of rows to limit",
                    "<br>",
                    "### Examples",
                    " - `{limit_table(table, 10)}` → Returns the table with 10 rows ",
                    " - `{hf(limit_table(table,5))}` → Show the pretty table with 5 rows",
                ]
            )
        ),
        detail="Table Manipulation",
        kind=2,
    ),
    # Column Operations
    dict(
        label="first_value(",
        insertText="first_value(${1:table_column})",
        documentation=dict(
            value="\n\n".join(
                [
                    "## first_value",
                    "Gets the **first value** values of a column/table",
                    "## Inputs",
                    "1. **table_column:** The table column or table",
                    "<br>",
                    "### Examples",
                    " - `{first_value(table_days_between)}` → Returns the first row of the column",
                    " - `{first_value(filter_gt(table, 'avg_tenure', 5, 'ltv'))}` → The first LTV where the average tenure is greater than 5",
                ]
            )
        ),
        detail="Column Operation",
        kind=2,
    ),
    dict(
        label="last_value(",
        insertText="last_value(${1:table_column})",
        documentation=dict(
            value="\n\n".join(
                [
                    "## last_value",
                    "Gets the **last value** values of a column/table",
                    "## Inputs",
                    "1. **table_column:** The table column or table",
                    "<br>",
                    "### Examples",
                    " - `{last_value(table_days_between)}` → Returns the first row of the column",
                    " - `{last_value(filter_gt(table, 'avg_tenure', 5, 'ltv'))}` → The first LTV where the average tenure is greater than 5",
                ]
            )
        ),
        detail="Column Operation",
        kind=2,
    ),
    dict(
        label="unique_values(",
        insertText="unique_values(${1:table_column})",
        documentation=dict(
            value="\n\n".join(
                [
                    "## unique_values",
                    "Gets the DISTINCT values of a column",
                    "## Inputs",
                    "1. **table_column:** The table column",
                    "<br>",
                    "### Examples",
                    " - `{unique_values(table_type)}` → Returns the unique rows of the type column from the table",
                    " - `{unique_values(greater_than(table_type, 4))}` → Returns the unique rows of the type column from the table",
                ]
            )
        ),
        detail="Column Operation",
        kind=2,
    ),
    dict(
        label="average(",
        insertText="average(${1:table_column})",
        documentation=dict(
            value="\n\n".join(
                [
                    "## average",
                    "Gets the **average** values of a column",
                    "## Inputs",
                    "1. **table_column:** The table column",
                    "<br>",
                    "### Examples",
                    " - `{average(table_total_customers)}` → Returns the average of the column",
                    " - `{average(filter(table_type, 'month', this_month, 'total_customers'))}` → Returns the average of the total customers for this month",
                ]
            )
        ),
        detail="Column Operation",
        kind=2,
    ),
    dict(
        label="sum_values(",
        insertText="sum_values(${1:table_column})",
        documentation=dict(
            value="\n\n".join(
                [
                    "## sum_values",
                    "Gets the **sum** values of a column",
                    "## Inputs",
                    "1. **table_column:** The table column",
                    "<br>",
                    "### Examples",
                    " - `{sum_values(table_total_customers)}` → Returns the sum of the column",
                    " - `{sum_values(filter(table_type, 'month', this_month, 'total_customers'))}` → Returns the sum of the total customers for this month",
                ]
            )
        ),
        detail="Column Operation",
        kind=2,
    ),
    dict(
        label="median(",
        insertText="median(${1:table_column})",
        documentation=dict(
            value="\n\n".join(
                [
                    "## median",
                    "Gets the **median** values of a column",
                    "## Inputs",
                    "1. **table_column:** The table column",
                    "<br>",
                    "### Examples",
                    " - `{median(table_days_between)}` → Returns the median of the column",
                    " - `{median(filter(table_type, 'month', this_month, 'days_between'))}` → Returns the median of the days_between for this month",
                ]
            )
        ),
        detail="Column Operation",
        kind=2,
    ),
    dict(
        label="min_values(",
        insertText="min_values(${1:table_column})",
        documentation=dict(
            value="\n\n".join(
                [
                    "## min_values",
                    "Gets the **min** values of a column",
                    "## Inputs",
                    "1. **table_column:** The table column",
                    "<br>",
                    "### Examples",
                    " - `{min_values(table_days_between)}` → Returns the min of the column",
                    " - `{min_values(filter(table_type, 'month', this_month, 'days_between'))}` → Returns the min of the days_between for this month",
                ]
            )
        ),
        detail="Column Operation",
        kind=2,
    ),
    dict(
        label="max_values(",
        insertText="max_values(${1:table_column})",
        documentation=dict(
            value="\n\n".join(
                [
                    "## max_values",
                    "Gets the **max** values of a column",
                    "## Inputs",
                    "1. **table_column:** The table column",
                    "<br>",
                    "### Examples",
                    " - `{max_values(table_days_between)}` → Returns the max of the column",
                    " - `{max_values(filter(table_type, 'month', this_month, 'days_between'))}` → Returns the max of the days_between for this month",
                ]
            )
        ),
        detail="Column Operation",
        kind=2,
    ),
    dict(
        label="variance(",
        insertText="variance(${1:table_column})",
        documentation=dict(
            value="\n\n".join(
                [
                    "## variance",
                    "Gets the **variance** values of a column",
                    "## Inputs",
                    "1. **table_column:** The table column",
                    "<br>",
                    "### Examples",
                    " - `{variance(table_days_between)}` → Returns the variance of the column",
                    " - `{variance(filter(table_type, 'month', this_month, 'days_between'))}` → Returns the variance of the days_between for this month",
                ]
            )
        ),
        detail="Column Operation",
        kind=2,
    ),
    dict(
        label="harmonic_mean(",
        insertText="harmonic_mean(${1:table_column})",
        documentation=dict(
            value="\n\n".join(
                [
                    "## harmonic_mean",
                    "Gets the **Harmonic Mean** values of a column",
                    "**Used for Conversion Rates as a better option than average**",
                    "## Inputs",
                    "1. **table_column:** The table column",
                    "<br>",
                    "### Examples",
                    " - `{harmonic_mean(table_days_between)}` → Returns the Harmonic Mean of the column",
                    " - `{harmonic_mean(filter(table_type, 'month', this_month, 'days_between'))}` → Returns the Harmonic Mean of the days_between for this month",
                ]
            )
        ),
        detail="Column Operation",
        kind=2,
    ),
    dict(
        label="percentile(",
        insertText="percentile(${1:table_column}, ${2:percent})",
        documentation=dict(
            value="\n\n".join(
                [
                    "## percentile",
                    "Gets the **percentile** values of a column",
                    "*note: We will user the lower value, if you want to interpolate then use percentile_cont*",
                    "## Inputs",
                    "1. **table_column:** The table column",
                    "2. **percent:** The percent (25- lower quartile, 50- median, etc..)",
                    "<br>",
                    "### Examples",
                    " - `{percentile(table_days_between, 50)}` → Returns the medain of the column",
                    " - `{percentile(filter(table_type, 'month', this_month, 'days_between'), 25)}` → Returns the 25th (lower quartile) percent of the days_between for this month",
                ]
            )
        ),
        detail="Column Operation",
        kind=2,
    ),
    dict(
        label="percentile_cont(",
        insertText="percentile_cont(${1:table_column}, ${2:percent})",
        documentation=dict(
            value="\n\n".join(
                [
                    "## percentile_cont",
                    "Gets the **continuous percentile** values of a column",
                    "*note: this will interpolate the value*",
                    "## Inputs",
                    "1. **table_column:** The table column",
                    "2. **percent:** The percent (25- lower quartile, 50- median, etc..)",
                    "<br>",
                    "### Examples",
                    " - `{percentile_cont(table_days_between, 50)}` → Returns the medain of the column",
                    " - `{percentile_cont(filter(table_type, 'month', this_month, 'days_between'), 25)}` → Returns the 25th (lower quartile) percent of the days_between for this month",
                ]
            )
        ),
        detail="Column Operation",
        kind=2,
    ),
    # MANIPULATION
    dict(
        label="iff(",
        insertText="iff(${1:condition}, ${2:if_true}, ${3:if_false})",
        detail="Runs an if statement with the conditions",
        kind=2,
    ),
    dict(
        label="significance(",
        insertText="significance(${1:control_count}, ${2:control_conversion_rate}, ${3:experiment_count}, ${4:experiment_conversion_rate})",
        documentation=dict(
            value="\n\n".join(
                [
                    "## significance",
                    "Computes the statisical significance of a 1/0 experiment",
                    "**note: If this is not a conversion rate, then use z_test**",
                    "## Inputs",
                    "1. **control_count:** The sample count of the control",
                    "2. **control_conversion_rate:** The conversion rate for the control group",
                    "3. **experiment_count:** The sample count of the experiment",
                    "4. **experiment_conversion_rate:** The conversion rate for the experimental group",
                ]
            )
        ),
        detail="Helper Function",
        kind=2,
    ),
    dict(
        label="z_test(",
        insertText="z_test(${1:count_a}, ${2:metric_a},  ${3:std_a},  ${4:count_b}, ${5:metric_b}, ${6:std_b})",
        documentation=dict(
            value="\n\n".join(
                [
                    "## z_test",
                    "Computes the statisical significance of an experiment",
                    "**note: If this is a conversion rate, then use significance**",
                    "## Inputs",
                    "1. **control_count:** The sample count of the control",
                    "2. **control_metric:** The metric for the control group",
                    "3. **countrol_std:** The STD of the metric",
                    "3. **experiment_count:** The sample count of the experiment",
                    "4. **experiment_metric:** The metric for the experimental group",
                    "3. **experiment_std:** The STD of the experimental metric",
                ]
            )
        ),
        detail="Helper Function",
        kind=2,
    ),
    # SUPERADMIN FIELDS
    dict(
        label="latex(",
        insertText="latex('${1:text}')",
        documentation=dict(
            value="\n\n".join(
                [
                    "## latex",
                    "Display a latex equation",
                    "*note: This will look weird in edit mode but will look good in the assembled version*",
                    "## Inputs",
                    "1. **text:** A latext value",
                ]
            )
        ),
        detail="Helper Function",
        kind=2,
        superadmin_only=True,
    ),
    dict(
        label="is_error(",
        insertText="is_error(${1:variable})",
        detail="Checks if the variable errored out",
        kind=2,
        superadmin_only=True,
    ),
    dict(
        label="narrative_link(",
        insertText="narrative_link(${1:narrative_slug})",
        detail="Creates a link to the narrative via the slug",
        kind=2,
        is_mavis=True,
        superadmin_only=True,
    ),
    dict(
        label="dataset_link(",
        insertText="dataset_link(${1:dataset_slug})",
        detail="Creates a link to the dataset via the slug",
        kind=2,
        is_mavis=True,
        superadmin_only=True,
    ),
    dict(
        label="activity_link(",
        insertText="activity_link(${1:activity_id})",
        detail="Creates a link to the activity via the id",
        kind=2,
        is_mavis=True,
        superadmin_only=True,
    ),
    dict(
        label="transformation_link(",
        insertText="transformation_link(${1:transformation_id})",
        detail="Creates a link to the transformation via the id",
        kind=2,
        is_mavis=True,
        superadmin_only=True,
    ),
    dict(
        label="customer_journey_link(",
        insertText="customer_journey_link(${1:customer})",
        detail="Creates a link to the customer journey using the first stream created",
        kind=2,
        is_mavis=True,
        superadmin_only=True,
    ),
    dict(
        label="customer_journey_w_stream_link(",
        insertText="customer_journey_w_stream_link(${1:stream}, ${2:customer})",
        detail="Creates a link to the customer journey using the stream and customer",
        kind=2,
        is_mavis=True,
        superadmin_only=True,
    ),
    dict(
        label="customer_journey_w_stream_w_activities_link(",
        insertText="customer_journey_w_stream_w_activities_link(${1:stream}, ${2:customer}, {3:activities})",
        detail="Creates a link to the customer journey using the stream and customer, and a list of activities",
        kind=2,
        is_mavis=True,
        superadmin_only=True,
    ),
    dict(
        label="customer_journey_w_stream_w_timestamp_link(",
        insertText="customer_journey_w_stream_w_timestamp_link(${1:stream}, ${2:customer}, {3:timestamp})",
        detail="Creates a link to the customer journey using the stream and customer, and a timestamp",
        kind=2,
        is_mavis=True,
        superadmin_only=True,
    ),
    dict(
        label="customer_journey_w_stream_w_activities_w_timestamp_link(",
        insertText="customer_journey_w_stream_w_activities_w_timestamp_link(${1:stream}, ${2:customer}, {3:activities},  {4:timestamp})",
        detail="Creates a link to the customer journey using the stream and customer,  a timestamp and an list of activities",
        kind=2,
        is_mavis=True,
        superadmin_only=True,
    ),
    dict(
        label="narrative_param_link(",
        insertText="narrative_param_link(${1:slug}, ${2:key}, ${3:value})",
        detail="Creates a link to a Narrative with custom parameters",
        kind=2,
        is_mavis=True,
        superadmin_only=True,
    ),
    dict(
        label="impact_simulator(",
        insertText="impact_simulator(${1:total_input}, ${2:percent_shift}, ${3:percent_from}, ${4:rate_from}, ${5:percent_to}, ${6:rate_to})",
        documentation=dict(
            value="\n\n".join(
                [
                    "## impact_simulator",
                    "Simulates the impact of shifting users from one group to another",
                    "<br>",
                    "## Inputs",
                    "1. **from_date:** The initial date",
                    "2. **to_date:** the final date",
                    "3. **datepart:** Either 'minute', 'hour', 'day', 'week', 'month', 'quarter', 'year'",
                ]
            )
        ),
        detail="Algorithm",
        kind=2,
        superadmin_only=True,
    ),
    dict(
        label="urlify(",
        insertText="urlify(${1:string})",
        documentation=dict(
            value="\n\n".join(
                [
                    "## hf_date_diff",
                    "displays the ",
                    "<br>",
                    "## Inputs",
                    "1. **from_date:** the from date",
                    "2. **to_date:** The to date",
                    "<br>",
                    "### Examples",
                    " - `{hf_date_diff(last_month, now())}` → '1 month ago'",
                ]
            )
        ),
        detail="Formatting Text",
        kind=2,
        superadmin_only=True,
    ),
    dict(
        label="spent_simulator(",
        insertText="spent_simulator(${1:best_cac}, ${2:best_cac_spent}, ${3:worst_cac}, ${4:worst_cac_spent}, ${5:percent_shift})",
        documentation=dict(
            value="\n\n".join(
                [
                    "## spend_simulator",
                    "Simulates the impact of shifting users from one group to another",
                    "<br>",
                    "## Inputs",
                    "1. **from_date:** The initial date",
                    "2. **to_date:** the final date",
                    "3. **datepart:** Either 'minute', 'hour', 'day', 'week', 'month', 'quarter', 'year'",
                ]
            )
        ),
        detail="Algorithm",
        kind=2,
        superadmin_only=True,
    ),
    # dict(
    #     label="_video_width(",
    #     insertText="_video_width(${1:cloudflare_id}, ${3:width})",
    #     detail="Imbedds the video with a specific width(default 600)",
    #     kind=2,
    # ),
    dict(
        label="img_link_w_width(",
        insertText="img_link_w_width(${1:link}, ${2:width})",
        detail="puts an image in the tab",
        kind=2,
        superadmin_only=True,
    ),
    dict(
        label="img_link_w_height(",
        insertText="img_link_w_height(${1:link}, ${2:height})",
        detail="puts an image in the tab",
        kind=2,
        superadmin_only=True,
    ),
    dict(
        label="img_link(",
        insertText="img_link(${1:link})",
        detail="puts an image in the tab",
        kind=2,
        superadmin_only=True,
    ),
    dict(
        label="_video(",
        insertText="_video(${1:cloudflare_id})",
        detail="Imbedds the video - Narrator internal only",
        kind=2,
        superadmin_only=True,
    ),
    # DEPRECATED
    dict(
        label="get_decimate_amount(",
        insertText="get_decimate_amount(${1:number})",
        documentation=dict(
            value="\n\n".join(
                [
                    "## get_decimate_amount",
                    "Intelligently rounds the values based on the value",
                    "*note: Rounds to the nearst Base10 Value*",
                    "## Inputs",
                    "1. **number:** A number you want to round",
                    "<br>",
                    "### Examples",
                    " - `{get_decimated(0.0003123212)}` → 0.0003",
                ]
            )
        ),
        detail="Helper Function",
        kind=2,
        deprecated=True,
    ),
    dict(
        label="good_text(",
        insertText="good_text('${1:text}')",
        detail="Displays the text larger and green",
        kind=2,
        deprecated=True,
    ),
    dict(
        label="bad_text(",
        insertText="bad_text('${1:text}')",
        detail="Displays the text as larger and red",
        kind=2,
        deprecated=True,
    ),
    dict(
        label="color(",
        insertText="color('${1:color}', '${2:text}')",
        detail="Add the color (ex. red200, blue500) of the texts",
        kind=2,
        deprecated=True,
    ),
    dict(
        label="pretty_diff(",
        insertText="pretty_diff(${1:from_date}, ${2:to_date}, '{kind}')",
        documentation=dict(
            value="\n\n".join(
                [
                    "## pretty_diff",
                    "displays the ",
                    "<br>",
                    "## Inputs",
                    "1. **from_date:** the from date",
                    "2. **to_date:** The to date",
                    "<br>",
                    "### Examples",
                    " - `{singular('order')}` → 'order'",
                    " - `{singular('calls')}` → 'call'",
                ]
            )
        ),
        detail="Formatting Text",
        kind=2,
        deprecated=True,
    ),
    dict(
        label="get_inflection(",
        insertText="get_inflection(${1:word}, ${2:tag})",
        detail="Gives the inflection of a word : ex. {'NN':'watch', 'NNS': watches', 'VB': watch', 'VBP': watch', 'VBD': watched', 'VBN': 'watched', 'VBG': 'watching', 'VBZ': 'watches'}",
        kind=2,
        deprecated=True,
    ),
    dict(
        label="greater_than(",
        insertText="greater_than(${1:table_column}, ${2:value})",
        detail="finds all values greater than the column",
        kind=2,
        deprecated=True,
    ),
    dict(
        label="less_than(",
        insertText="less_than(${1:table_column}, ${2:value})",
        detail="finds all values less than the column",
        kind=2,
        deprecated=True,
    ),
    dict(
        label="greater_than_equal(",
        insertText="greater_than_equal(${1:table_column}, ${2:value})",
        detail="finds all values greater or equal to than the column",
        kind=2,
        deprecated=True,
    ),
    dict(
        label="less_than_equal(",
        insertText="less_than_equal(${1:table_column}, ${2:value})",
        detail="finds all values less than or equal the column",
        kind=2,
        deprecated=True,
    ),
    dict(
        label="percent_improvement(",
        insertText="percent_improvement(${1:higher_val}, ${2:lower_val}, ${3:higher_is_good})",
        documentation=dict(
            value="\n\n".join(
                [
                    "## percent_improvement",
                    "Computes the percent improvement",
                ]
            )
        ),
        detail="Helper Function",
        kind=2,
        deprecated=True,
    ),
    # dict(
    #     label="create_toggle(",
    #     insertText="create_toggle(\n'${1:hide_text}',\n'''\n${2:body_text}''')",
    #     detail="Hide/Show the data",
    #     kind=2,
    # ),
    # dict(
    #     label="new_tab_link(",
    #     insertText="new_tab_link('${1:link}', '${2:label}')",
    #     detail="fits a link that opens in a new tab ",
    #     kind=4,
    # ),
]


MAVIS_FUNCTIONS = [func["label"][:-1] for func in SUPPORTED_FUNC if func.get("is_mavis")]
SORTED_FUNC = sorted(SUPPORTED_FUNC, key=lambda a: len(a["label"]), reverse=True)
SUPPORTED_WORDS = [func["label"][:-1] for func in SUPPORTED_FUNC]
