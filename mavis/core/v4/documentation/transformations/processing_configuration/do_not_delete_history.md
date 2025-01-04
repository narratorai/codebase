# Do not delete data when resyncing

When Narrator resyncs the transformation, it will automatically delete all the data from that transformation in the `{table}` table and reinsert it.

If this flag is enabled, then it won't delete the data.



------


# Use Cases


**Transformations that are dependent on data that no longer exists**

Let's say you want to detect a customer that changes their email.  You may write a transformation like the following:

```SQL

SELECT
    u.id as activity_id
    ...
    'updated_email' as activity,
    u.email as customer,
    ...
FROM users_table u
LEFT JOIN {table} a
    on (a.activity = 'updated_email' an a.activity_id = u.id)
where a.customer is NULL or a.customer <> u.email

```

In this example, you are diffing based on data that is in the `{table}` so if you resync this, you will lose all the data that has been logged.  Checking this box stops that.
