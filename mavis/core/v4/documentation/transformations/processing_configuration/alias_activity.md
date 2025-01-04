# Process as an alias activity

An aliasing is a special type of activity that can be used when the universal identifier for a customer changes, but you want to ensure the historical data and future data is associated with the same customer ID. An aliasing activity can be used to link the customer identifiers.


*Example of this setup [Alias Activity Transformation](https://docs.narrator.ai/page/what-are-aliasing-activities)*

<br>


**For example**

Every time the `Run Transformations` updates it will:

Update all the data (`t`. )

```SQL
Update {table}
    set customer = t.customer
USING (
    SELECT ...
    FROM {table}
    where activity = THIS_ACTIVITY
) as t
where customer = t.anonymous_customer_id
```



------


# Use Cases


**Customer updates their email**

A customer might start with a personal email then they might switch it to their work email.  Instead of trying to resync all the transformations from all the data sources to map the old email to the new email, simply log the change and Narrator will auto do it for you.

<br>


**Merged lead accounts**

In sales we may have 2 different contacts for the same person. Most sales tools allows you to merge it. If the `contact_id` is your customer identifier, you can now log the merged contact and have narrator update all the old values.
