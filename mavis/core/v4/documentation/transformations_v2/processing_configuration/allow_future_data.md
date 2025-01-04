# Allow Future Data

By default, Narrator will not add activities to the activity stream if the timestamp is in the future. If you want to override this setting (ie. capture events that will happen in the future), you can check the allow future data setting. This will remove the timestamp constraint and allow you to add future data to your activity stream.



*NOTE: If you allow future data, you may want to use an update type that is NOT incremental/ or have a delete_recent_days checked*


------


# Use Cases


**Projecting Data**

Sometimes we like to project contracts out to future `received_invoice` for each customer so you can better project MRR and ARR over time.

<br>


**Future Posting**

If you have scheduled posts, you may want to add it to Narrator to see what these posts will be like. This is an easy way to enable that data.
