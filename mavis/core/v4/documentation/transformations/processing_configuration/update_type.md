
> **WARNING**: Please be very careful when changing the update type since this can greatly affect the load and processing on your warehouse.


# Update Types

Update types control how Narrator processes your transformation when inserting data into your activity stream, enrichment table, or customer table.

This process the data on each update.




<br>
<br>



## Incremental (Default)

**Recommended for most activities**


| Situation |Impact|
|:----|:----|
| On Every Update | Insert all data from the transformation after the last timestamp (`MAX(ts)`) in the `{table}` table. |
| On Resync | Delete all the data and inserts |
| Max rows inserted |  Based on your companies `Maximum Rows to Insert` (set in [Manage Company Config]({company_url}/manage/company)) <br> .... **IGNORED** if you have a `Only Process Data After` and an `Incremental (in Days)` |
| Starts data at | if set use `Only Process Data After` , <br> then if set use companies `Only Insert Data after` [Manage Company Config]({company_url}/manage/company) <br> else `1900-01-01` |
| Used For | Activities and Enrichment |



<br>
<br>



## Full Data Resync (aka Materialized Views)

**Recommended for customer tables**

| Situation |Impact|
|:----|:----|
| On Every Update | Deletes all the data in the `{table}` and reinserts it all |
| On Resync | Delete all the data and inserts if all (if columns change, it will drop the table and recreate it) |
| Max rows inserted | IGNORED |
| Starts data at | if set use `Only Process Data After` , <br> then if set use companies `Only Insert Data after` [Manage Company Config]({company_url}/manage/company) <br> else `1900-01-01` <br> ... **IGNORED** if Customer Attribute|
| Used For | Customer Table and **in rare cases** Activities |



*If just recent data is changing I highly recommend doing Incremental with a "delete recent days" to only resync a window of the data. (computationally much cheaper)*



<br>
<br>



### Sync Once

| Situation |Impact|
|:----|:----|
| On Every Update | DOES Nothing|
| On Resync | Delete all the data and inserts all the data |
| Max rows inserted |  Based on your companies `Maximum Rows to Insert` (set in [Manage Company Config]({company_url}/manage/company)) <br> .... **IGNORED** if you have a `Only Process Data After` and an `Incremental (in Days)` |
| Starts data at | if set use `Only Process Data After` , <br> then if set use companies `Only Insert Data after` [Manage Company Config]({company_url}/manage/company) <br> else `1900-01-01` |
| Used For |  Activities and Spend Tables |



<br>
<br>


### Insert Missing Rows Only

**Very computationally expensive (with large data)**


| Situation |Impact|
|:----|:----|
| On Every Update | Compare all the `activity_id`/`enriched_activity_id`/`customer` (based on the type) and inserts any rows that are not already in the `{table}`  |
| On Resync | Delete all the data and inserts |
| Max rows inserted |  Based on your companies `Maximum Rows to Insert` (set in [Manage Company Config]({company_url}/manage/company)) <br> .... **IGNORED** if you have a `Only Process Data After` and an `Incremental (in Days)` |
| Starts data at | if set use `Only Process Data After` , <br> then if set use companies `Only Insert Data after` [Manage Company Config]({company_url}/manage/company) <br> else `1900-01-01` |
| Used For | **In rare cases** Activities that use Identitity Resolution |


**If you want to save on load, try and make the `Nightly missing data check (in Days)` to be really large and every night we will diff all the data.**




----


# FAQ

**If I change the type, does that resync the data**

Changes to the update type will automatically be applied in future updates.  So you can change it without resyncing the data

<br>


**If my features are changing or data is being deleted, what type should I use?**

The only types that can deal with changes in Features or deletes is `Full Data Resync` or if you use the `delete_recent_days` checkbox.


<br>


**When should I use Insert Missing Rows Only?**

I you have data that comes in at random times and that data is applying identity resolution then this might be useful.  It is costly but less costly than identity resolution.
