# Skip Row Counts (Data too large)

> This is **ONLY** for really large data!
>
> If you have never used this, please talk to the support team

By default, Narrator will count the rows in the query over time and insert data.  

In some situations, the query is to expensive to run a count (ex. large >10B row table with a window function).  For this query, you would rather leverage `{{from_sync_time}}` and `{{to_sync_time}}` inside the query and only run it at a smaller window.  When you set the incremental days to be 30 days, then Narrator will try and insert 30 days blindly.


--------


# Use Cases

**Data is really large and the query is extremely  expensive**

This was built for situations where you have a very expensive query that running a count query is so expensive that it is better to not do it.
