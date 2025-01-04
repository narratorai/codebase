# Slowly Changing Dimensions

These are dimensions that are changing in time.  Think history tables.

The `slowly_changing_ts` is the timestamp where the row is `valid_from`

<br>

For example, let's assume we have a table of emails and you have the following

| id | updated_at | email|
|-----|------------|---------|
| 4 | 2020-03-04 | test@example.com|
| 4 | 2022-07-01 | real_test@example.com|

<br>

So the `id` 4 was updated at `2022-07-01` from `test@example.com` to `real_test@example.com`.

When this is used in the activity, based on the `ts` of the activity, Narrator will join to `id` using the last valid email.

So if we are looking at an activity on `2021-01-1` the email will be `test@example.com`  but if we look at an activity on `2023-01-01` the email will be `real_test@example.com`




-----



# FAQ

**When should I model an attribute as an activity or a slowly changing dimension?**

We sometimes model slowly changing dimensions as activities. For example, "Updated Subscription" or "Updated Contract Value".  This is helpful when understanding something core to your business.

Sometime the SCD is not important enough or has many attributes that you don't want to pull with a special activity. For example, "Inventory", "Product Details", "Customer Account Information".  These might be better as SCD since they are either:
- Not directly related to the customer but are related to a feature
- Have multiple attributes
- Not that important to be shown as an activity

<br>


**Why not model the value on the activity as a feature?**

There are several reasons to not put it on the activity:

1. Data size.

You can add "inventory" on every activity but it changes way less than products are viewed so maybe a SCD with sku,time and inventory is a better mode.

2. Multiple activities

You can copy the data on multiple activities, but if something changes and you want to resync it, you will need to resync all the activities.
