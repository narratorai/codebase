<!-- Shown in the transformation types to guide the user on each type. TODO: Pull more data from the docs into here-->

## What is a transformation?

A transformation is the SQL query that transforms your source data into a standardized format so it can used in Narrator.

Four types:
1. [Activity Transformations](doc:activity-transformations) define activities so they can be added to the activity stream
2. [Customer Transformation](doc:customer-transformations) creates a customer table
3. [Enrichment Transformation](doc:enrichment-transformations) adds additional features to activities by creating an enrichment table
4. [Spend Transformations](doc:spend-transformations) are a special type of enrichment transformation that creates a spend table to record historical marketing spend, clicks, impressions, etc.

The processing for each transformation can be managed in the [Processing Config](doc:data-processing).
