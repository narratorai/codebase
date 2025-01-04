# Alerts

Alerts are extremely valuable when trying to guarantee the quality of your data.   Below are some ways we recommend making the most of your alerts.

<br>
<br>

## Alert on the query in production

You can write an alert the is based on the query that is in production by using the `{{production_query}}` variables.


```sql

{default_validation_query}

```


<details>

<summary>The exact query that will be run</summary>

When this query is tested, it will run the following query

```sql
{exact_query}
```

</details>


<br>
<br>

## Alert on the raw data

It might be helpful to make sure the core tables used in your query are updating

*ALERT IF NO ROWS RETURN*


```sql
SELECT
    *
FROM TABLE s
where s.TIME_COLUMN > {day_ago_sql}

```

<br>
<br>

## Alert on the data coming out of processing

For complex queries (also to save computation) you can see if the data in your `{table}` is up to date

*ALERT IF NO ROWS RETURN*


```sql
SELECT
    *
FROM {table} s
where s.ts > {day_ago_sql} and {activity_source_condition}
```

<br>
<br>

## Alert on the entire Activity
For complex queries (also to save computation) you can see if the data in your `{table}` is up to date

*ALERT IF NO ROWS RETURN*


```sql
SELECT
    *
FROM {table} s
where s.ts > {day_ago_sql} and {activity_source_condition}
```


<br>
<br>

## Alert on the output with some additional logic

Sometimes we want to make sure new useres are coming or something more granular. You can simply write the query here to capture that

*ALERT IF NO ROWS RETURN*


```sql
SELECT
    *
FROM {table} s
where s.ts > {day_ago_sql} and {activity_condition} and {activity_occurrence_condition}
```



----

# FAQ

**What happens when this alert fails?**

You receive an email letting you know about the alert.


<br>

**Does this stop the transformation from updating?**

NO! This is for you to be informed.

We are considering allowing this these alerts to put the transforamtion in Error mode so everyone is informed.


<br>


**Why cannot I save my alert?**

If your query is using any of the variables for optimization (i.e. `{{from_sync_time}}`, `{{count_comment}}`) then we will not let you save it.

*Why do we do that?*

If you are optimizing your query, we assume you don't want to put a huge load on the warehouse so wrapping your entire query with a time filter is actually very expensive since it will scan your entire system.


We Recommend you put an alert on the raw table that powers it or the Activity Schema table (`{table}`)
