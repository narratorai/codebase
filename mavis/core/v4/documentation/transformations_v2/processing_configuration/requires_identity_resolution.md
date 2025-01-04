# Requires Identity Resolution

If an activity transformation's SQL includes a non-NULL source, then this setting will be automatically applied. Any transformation that has an `anonymous_customer_id` will have identity resolution applied after the data has been updated in the `{table}` table, but you can override the defaults in the Advanced Configuration settings.


Learn more about our [Identity Resolution Process](doc:identity-resolution)



----

# FAQ

**What happens when I resync a transformation that uses Identity Resolution?**

We will undo the mapping caused by that transformation then apply the new mapping.


<br>


------


# Use Cases


**Attributing customers to their web activity(Cookie)**

A customer who comes to your website may start as a cookie but then they will give you their information and
thus you can log the data using their cookie as the `anonymous_customer_id` and
when they give you their information you can log that value in the `customer` column.

Take a look at some examples of these transformations: [Examples of dedicated transformations](doc:identity-resolution-1)


<br>


**Mapping ticket to real users**

When you deal with multiple systems, you may want to log the data using that system's customer identifier.

For example, Zendesk uses a `submitter_id`.  Once you map that user to your `customer`, you can log that row and have Narrator stitch it for you.
