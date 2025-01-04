# Select a Feature to slice by

This is the main dropdown and it has all the power.  Based on the mode this dropdown will show you different values.

<br>

### Some more nuances

**Attribute** shows NULL if the customer doesn't exist in the customer table. This is common for unidentified customers.

A**ctivity Behaviors** are auto grouped by customer who "Did" and "Did Not" do the action. Also if you see in between it is looking in between the kpi conversion activities.

**Activity Features** are filtered for customers who've actually done the activity.

**Event In Time** are only events on the company, KPI or for activities used in the KPI definition.



---




# FAQ


**What is the feature if someone never did the activity?**

We filter for only customers who actually did the activity so you can focus on the actions that matter.

<br>


**How do I rename the feature?**

This feature is coming soon ...


<br>

**Is `... in between` doing what `in between` in dataset?**

No!  We only show in between for conversion KPIs.  This is equivalent to doing `in between` with a **but before** the second activity.


<br>


**If I use an event in time and then I update the time line will the data be updated?**

YES!  If you make any changes to the event (whether the activity, kpi or company), this data will be updated to reflect the new data and descriptions.
