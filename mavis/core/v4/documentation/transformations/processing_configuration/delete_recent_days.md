# Delete Recent Days


This setting will delete the data from the most recent days (the number of days is specified in the settings) before incrementally updating the data in the `{table}` table. This can be helpful when it takes a few days for data to stabilize (usually counts or aggregates for daily reporting) and you don't want to add the most recent data until the data has stopped changing.


<br>


**For example**

If delete_recent_day is set to: `10`

Every time the `Run Transformations` updates it will:

1. Delete all the data in that transformation from the last 10 days

    ```sql
    DELETE .... where ts > DATE_ADD('day', -10, SYSDATE)
    ```

2. Then, complete a normal update to reinsert all the data until today




------


# Use Cases


**Data is changing but you want to save warehouse costs**

Sometimes your data is changing and you don't want to fully materialize the data.  You can use this to save warehouse costs by just deleting the last 6 months of data and reinserting them. (This assumes that data older than 6 months doesn't change)

<br>


**Advertising data that is changing**

Typically metrics are reported on a daily basis and thus the last 2 days will be changing as more data is collected.
Ex. CPC on 8/2 will be changing as more data is collected during that day.

<br>


**Your source data is a daily aggregation**

If your transformation uses a table that is an aggregation, the last row is often changing every couple of hours with the most recent updates.

<br>


**The source data has records that are sometimes deleted soon after being created (they were created by mistake)**

For example, if you have a column called `deleted_at` that gives the timestamp of when the record was deleted, you should do a time_diff on the `created_at` and `deleted_at` column to filter out any records that were deleted within a few hours of being created. This indicates a data entry error. To prevent this data from being added to your activity stream, use "Delete Recent Days" to ensure that records that were erroneously added are not inserted into your Activity Stream.



<br>


**Your source data has delayed processing**

If you use another data source (ex. Clearbit) to enrich all the leads in your warehouse.  And you want the enrichment to occur **before** the data is inserted into the Activity Stream. Use delete recent days to account for the fact that the data is still changing for recent records.
_Note: For lead enrichment, Narrator recommends putting all relevant enrichment columns in the customer table instead_
