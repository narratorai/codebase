# Only Process data after

This enables you to only update data after a certain data

1. Pretty much we are filter the data after that certain date.

    ```sql
    WHERE ts > START_DATE
    ```


> **NOTE**: When resyncing the data **all** the data will be deleted.  If you don't want this then look at the lower use case "Splitting the Transformation"


---


# Use Case

**More Control**

By default we will insert all the data in the transformation.  

If you want to set a date filter for all your data, you can control that in the {company_url}/manage/company and change `Only insert data after`.  However, what if you want to just control 1 transformation, then this is when this feature is helpful.  You can have this filter just the data you need.

<br>


**Splitting the Transformations**

Some times we change our definitions so it is useful to have 2 transformations.

1. First Transformation has the data till a certain date. Use `where ts < DESIRED_DATE` in the SQL query.  And set the update type to be `Sync Once`

2. For this transformation, you can use "Only Process data after" to only insert new data.
