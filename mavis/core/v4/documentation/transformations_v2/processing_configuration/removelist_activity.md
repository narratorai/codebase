# Is a Removelist activity

Use this check box if every `customer` and/or `anonymous_customer_id` in this transformation should be deleted from your `{table}` table.


------

# FAQ

**What happens when I resync a transformation that uses Removelist?**

We will reinsert all the users that were removed by the transformation then apply the new removelist activity.

<br>

----

# Use Cases


**Internal Employees**

We often have data in our warehouse that is of our internal employees which we usually want to remove from ussage reporting.  Creating a remove list with all internal employees can have Narrator automatically do that for you.


<br>

**Test Users**

Testing is crititcal and while your Eng team may test in a staging environment, a lot of people will test in production.  This causes weird data and is annoying to clean.  Instead just remove it here.

<br>


**Fraud Traffic/ Users**

Website traffic can be misleading with so many bots on websites scraping them.  Also a lot of companies will pay for bots to spam competitors websites using their Ads to make the company waste money investing in ads that don't work.

You can now detect bots and flag them, so all your data is clean.

Here is a blog that we wrote about [detecting some bot behavior in SQL](https://www.narrator.ai/blog/identifying-bot-traffic-with-sql/)
