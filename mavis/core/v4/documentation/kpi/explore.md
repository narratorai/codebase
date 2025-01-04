# KPI Explore

Quickly slice and dice by attributes, behavior, features, and more...

<br>

**Start with `Attributes`!**

Once you select an attribute you will be able to see the impact it has.

<img src="https://i.ibb.co/2vfw7Fq/Screen-Shot-2022-05-06-at-1-49-03-PM.png">

---

<br>

### Statistical significance

Statistical significance is computed using a dual-sided chi-square test with two groupings. A KPI is considered significant if there is 95% confidence that it is not random.

<br>

### KPI by feature over time

We like to show the data over time to highlight if the feature is still valid. This is important because the significance of a KPI may have been high a while ago, but has since lost its significance.

---

# FAQ

**How do I save my explore?**

Once you run the attribute, you will see a button to save the data.

<br>

**How do I run a significance test if there are many groups?**

If you see too many groups, then try using the `Group Feature` to group values into 2 buckets to make it possible to do a statistical significance.

<br>

**Can I use this for A/B testing?**

We recommend creating a `viewed_ab_test` activity with a feature being the experiment and a value being control/variation.

You can then use the `Feature Activity` mode and select the `variation from first ever viewed ab test`. Then use the _Filter Activity_ to filter for the experiment that you are evaluating.

<br>

**How do I run the full Narrative?**

Once you `save` from the explore, you will be able find and run the full Narrative analysis in the [Saved Explores]({company_url}/kpi/{metric_id}/saved) tab.

<br>

**How do I see the dataset that generates these plots?**

Once you `save` the explore, you will be able to see a link to the dataset.
