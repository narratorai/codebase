# Manually partitioned Activity

_Recommended for activity streams larger than 100 million records and BigQuery Warehouses._

By Default, Narrator creates one table for all activities. This is great but for some warehouse and some data sizes you may want to create a new table per activity.

**Default**

Narrator creates a single table `activity_stream` that has all activities

**Manually Partitioned**

Narrator creates a table `activity_stream_[ACTIVITY_SLUG]` for each activity

---

# FAQ

**Does the UI change?**

Nope, everything is the same in Narrator and we do this completely on the backend

<br>

**Does this affect warehouse costs?**

Manually partitioning the activities reduces cost on most warehouse because:

1. Less data to scan
2. Less data to update (infrequent tables are not touched)
3. Cheaper updates of customer `activity_occurrrence` and `activity_repeated_at`

<br>

**Can I change this back in the future?**

Yes, you can toggle this on and off and not worry about it. Narrator will handle the change in the next update
