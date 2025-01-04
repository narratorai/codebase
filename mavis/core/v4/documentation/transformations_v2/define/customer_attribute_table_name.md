<!-- Shown as the help to the table name when a customer chooses the type customer_attribute -->

## What is customer in Narrator?
In Narrator, all activities are linked to a `customer` that represents the person or entity that completed each action. The identifier that you choose to use for your `customer` will be used for all activities in Narrator. That's why we recommend using something like `email_address` to uniquely identify your customer across sources.


<br><br>

## What should I put here?
By default we will call your table `customer` but you can rename it to anything.
Consider making the name useful.


<br><br>


------

# FAQ

**Can I use a different customer table?**

Yes, you can use any table you want by navigating the the [Company Seetting]({company_url}/manage/company) and picking any table you want to use.  Your new table does **NOT** need to have a `customer` column and can use anything.

<br>


**What happens if the `customer` column is duplicated?**

Narrator will not let you merge a transformation with duplicates in the customer column.

If you are using customer table via Narrator or any other system, the **Run Data Diagnostics** task will check for duplicates and ensure the data is accurate.  

<br>

*Note: If you are using Narrator for the processing, we will also debug the reason for the duplication and let you know*
