# Filter the activity for limited values

Filtering allows you to narrow down the feature you're interested based on another feature.

An example of this is: I want to see all the Browser, but only on PC devices.


------


# FAQ


**Can I use this for A/B testing?**

This is actually one of the most common uses for this feature.  Customers often have a `Viewed Experiment` activity and will filter for the exact experiment.

<br>


**What if the value doesn't appear the first time a customer does this activity?**

We apply the filter before the **first** is applied.  So what this is doing is:
    1. out of everyone who did this activity
    2. filter down to everyone who have the following feature
    3. then give me the first value we see.
