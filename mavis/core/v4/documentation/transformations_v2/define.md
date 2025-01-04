## Transformation Overview

What's in the Transformations tab of Narrator? Check out this video...


<a href="https://www.loom.com/share/21ff8742b0bf4c62837807c16ed5c2a0">
    <p>Navigating Transformations - Watch Video</p>
    <img style="max-width:300px;" src="https://cdn.loom.com/sessions/thumbnails/21ff8742b0bf4c62837807c16ed5c2a0-1597244864004-with-play.gif">
  </a>



----

# FAQ

**What is the difference between transformations and activity?**

Transformation is the SQL that creates the activity.


<br>

**Can 1 transformation create multiple activities?**

Yes, 1 transformation can create multiple activities. Also many transformations can create one activity.


<br>

**What should I name my activity?**

We recommend naming them as actions in the past tense.

- viewed_page
- called_us


<br>

**How many activities should I create?**

Start with a couple that answer the questions you have and add as you go.


<br>

**What if I want to add something that is not related to a customer?**

This is very common and you will soon see that everything can be related to a customer.

For example:
- An investment portfolio grows just because the stock price changed -> Create an `updated_portfolio` that is tied to the customer.
- A customer was considered spam.  -> Create a `flagged_as_spam` activity
etc...
