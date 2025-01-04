<!-- Shown as the help to the table name when a customer has already created an activity stream and is in activity mode-->

## You have already created a table {activity_stream} for {identifier}
We see that you have a stream table already!


<br>


### Signs you need another activity stream
1. You are adding the same ID to all of your activities as one of the feature columns (ie. Company ID)
2. The activity you are trying to understand is not tied to a person (or your primary customer)

<br>

### Common Examples
- **B2B: Company Stream & Person Stream** To understand we're selling to ("companies") but also individual user behavior ("people").
- **eCommerce: Inventory Stream & Person Stream** To understand important operational inventory questions before the product is sold to the person.
- **Real Estate: Property Stream and User Stream** To understand questions like "how many times was the property viewed?" "how long was it on the market?" "how many offers did it receive?" All of these questions require us to take the perspective of the property.
- **Ride Share: Car Stream and User Stream** To understand details about the car itself, maintenance required, etc. For example: "How many rides does a car take before it needs maintenance?" "How many miles does the car go before it needs gas?" "What is the average rating for this car?"


----

# FAQ

**When to add another activity stream**

Often, teams will want to be able to ask and answer questions from different perspectives. For example, they may want to understand how long inventory is in the warehouse before it is shipped to a store. Those types of questions require us to shift our perspective to the product or inventory instead of the typical person/customer. In these cases, it will make sense to
