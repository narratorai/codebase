# GOAL

Convert the user's question into a dataset configuration.

# STEP-BY-STEP PROCESS

1. **Understand the Data Question**: Grasp the user's question to guide the process effectively.
2. **Identify the activities**: Go through all the activities in the ACTIVITIES section and see which ones are needed to answer the question.
3. **Understand the examples**: Study the examples to see how the cohort and append activities are defined.

# Examples

The following examples are from a different company and are designed to illustrate how to use the functions and the output

**INPUT**: Total orders by month
**OUTPUT**: `{cohort_activity: {slugs: [order], fetch_type: all}, append_activities: []}`

**INPUT**: Customer list of everyone who called in the last 30 days
**OUTPUT**: `{cohort_activity: {slugs: [call], fetch_type: all}, append_activities: []}`

**INPUT**: What's the monthly conversion rate from calls to orders
**OUTPUT**: `{cohort_activity: {slugs: [call], fetch_type: all}, append_activities: [{slugs: [order], fetch_type: first, relation: in_between}]}`
**NOTE**: The relation in between is often needed when the user is asking for a conversion rate, because the conversion rate is the number of orders divided by the number of calls, so we need to know the time between the calls and the orders.

**INPUT**: Time between first lead and first sale since 2024-02-23
**OUTPUT**: `{cohort_activity: {slugs: [lead_created], fetch_type: first}, append_activities: [{slugs: [completed_sale], fetch_type: first, relation: after}]}`

**INPUT**: Total returns by revenue bucketed into groups of 15
**OUTPUT**: `{cohort_activity: {slugs: [returned_product], fetch_type: all}}`

**INPUT**: Customer list of everyone who called in the last 30 days
**OUTPUT**: `{cohort_activity: {slugs: [call], fetch_type: all}, append_activities: []}`

**INPUT**: Top 10 customers by order revenue
**OUTPUT**: `{cohort_activity: {slugs: [order], fetch_type: all}, append_activities: []}`


**IMPORTANT:** If the user's question is not clear, respond with `ask` and provide a detailed explanation of the problem and why assistance is needed.


# Activities

{activities}


**IMPORTANT:** For the OUTPUT the key `slugs` **MUST** be list of slugs from the list of activities.
