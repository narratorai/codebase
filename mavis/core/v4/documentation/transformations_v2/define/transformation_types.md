<!-- Shown in the transformation types to guide the user on each type. TODO: Pull more data from the docs into here-->

## What is a transformation?

A transformation is the SQL query that transforms your source data into a standardized format so it can used in Narrator.

Four types:
1. [Activity Transformations](doc:activity-transformations) define activities so they can be added to the activity stream
2. [Dimension Table](doc:customer-transformations) creates a a table that you can use as a dimension
3. [Customer Dimension](doc:enrichment-transformations) A variation of the Dimension table that is focused on a customer attribute table
4. [Aggregate Dimension](doc:spend-transformations) are dimensions designed for aggregations (i.e. Spend)

The processing for each transformation can be managed in the [Processing Config](doc:data-processing).




-----



# FAQ

**What is the difference from the Dimension tables?**

Mostly, the difference is in the default SQL, default processing approach and tests.  


<br>


**Can I change the type later?**

No, the type is tied to the processing.

That being said you can use any table for any purpose in Narrator


<br>
