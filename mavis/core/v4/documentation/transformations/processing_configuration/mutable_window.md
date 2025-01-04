# Time Window for reconcile stream processing


Narrator runs a [Reconcile Stream Processing]({company_url}/manage/tasks) on a schedule of your choosing where we look for any missing rows that the incremental update didn't pick up in this time window.

By default Narrator will use the value set in your [Company Processing]({company_url}/manage/company) but you can override the data for a specific transformation here


------


# FAQ


**How can rows be missed?**

Let's assume you have a transformation that joins `TABLE_A` and `TABLE_B`.  These tables join on `SOME_KEY`.

Now let's assume that a run queries the data in between your EL tool updating `TABLE_A` and `TABLE_B`.  This join might drop a row because the second table hasn't been updated yet.


<br>


**Why do I need to specify a day window?**

While this is possible, it happens in very small increments and gets fixed because of eventual consistency.  So running it over the last couple weeks will cover all the data and saves you a lot of compute cost.


We can do this automatically, but we believe in giving you full control over your data so we give you the ability to control it, if you would like to make any changes.
