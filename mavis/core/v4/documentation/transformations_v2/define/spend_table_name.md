<!-- Shown as the help to the table name when a customer chooses the type spent -->

## What is a Aggregation table?


An aggregation Dim is useful when you have features that you want to join on a grouped data. This table requires a `id` column and a `ts` column (if you want to use incremental updates)


For example, Spend data.  You probably want to join that using time + campgain.


<br>

## How is it used?

The Aggregation Dimension can be joined to any grouped dataset.

1. You will be able to apply the aggregation logic to the column here (ex.  if your joining by a `date_trunct(month, ts)` to a `date` column in the Aggregation dimension, Narrator can automataically apply the `date_trunc(month, date)` to the aggregation).
2. You will be able to join by multiple columns
3. You can add any metric from the Aggregation dimension (ex. Sum(spend), Sum(clicks), ...)
4. If you cannot join the data, Narrator can also distribute the metrics in the join table using the rows of data.


For the most common use-case, check out: [How To: Add Spend Data to your Dataset](doc:add-spend-data-to-your-dataset) to see how it's used.



<br>

**How to I tell Narrator the Aggregation Dimensions?**

Once the table is built, add it to the a specific Activity Steam via the [Company Setting]({company_url}/manage/company).

<br>
