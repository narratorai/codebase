<!-- Shown as the help to the table name when a customer chooses the type spent -->

## What is a spend table?

A spend table maintains all of the details about your company's marketing spend, campaign details, and utm parameters.

Every marketing dollar cannot be associated to a specific customer, so the spend data is aggregated before it is joined to the data in the activity stream. This ensures that _all_ marketing spend details are used when evaluating marketing performance.

<br>

## How is it used?
The spend table can be joined to any grouped dataset to enrich it with marketing details like total spend, clicks, impressions, etc. The data in the spend table is aggregated before it is joined to the grouped dataset.

See [How To: Add Spend Data to your Dataset](doc:add-spend-data-to-your-dataset) to see how it's used.

<br>


## Columns in an Spend Transformation

A spend transformation generates a dataset with six required columns and any number of additional columns related to marketing (campaign, utm parameters, etc). Spend transformations are a specific implementation of an enrichment transformation.
