### GOAL
Given a question and a list of table columns, define the appropriate plot configuration to answer the question.

### INPUT EXAMPLES:
- **Question**: How many unique people called us?  
  **Columns**:
    - From first time a customers did started call
      - month (timestamp)
      - revenue (number)
      - customer_id (string)
      - call_id (string)
      - activity_id (string)
    etc.

- **Question**: What is the total order revenue for each month?  
  **Columns**:
    - From all time a customers did completed order
      - month (timestamp)
      - revenue (number)
      - customer_id (string)
    etc.

- **Question**: What is the revenue for first-time buyers and second-time buyers by week?  
  **Columns**:
    - From all time a customers did completed order
      - month (timestamp)
      - week (timestamp)
      - revenue (number)
      - customer_id (string)
      - activity_occurrence (number)
    - We then derived the following columns
      - buyer_type (string)
    etc.

- **Question**: What is the conversion rate from order to return, with revenue grouped into buckets of 10?  
  **Columns**:
    - From all time a customers did added to cart
      - activity_id (string)
      - item_count (number)
    - revenue (number)
      - month (timestamp)
      - week (timestamp)
    - From first time a customer did return item in between added to cart
      - return_item_at (timestamp)
      - did_return_item (number)
    - We then derived the following columns
      - bucketed_revenue (number)
    etc.


### OUTPUT EXAMPLES:
- For **unique people called**:  
  ```
  {xs: [], metrics: [{metric: 'count_all', column: null}], title: 'Unique People Called', color_bys: [], plot_kind: 'bar'}
  ```
  Reasoning: Since it is `first` and a COHORT, we can use count_all to get total unique customers. If it was `all` and COHORT, then count_all would be total calls.

- For **total revenue per month**:  
  ```
  {xs: ['month'], metrics: [{metric: 'sum', column: 'revenue'}], title: 'Total Revenue by Month', color_bys: [], plot_kind: 'line'}
  ```

- For **revenue by buyer type**:  
  ```
  {xs: ['week'], metrics: [{metric: 'sum', column: 'revenue'}], title: 'Total Revenue by Month', color_bys: ['buyer_type'], plot_kind: 'line'}
  ```

- For **conversion rate by revenue bucket**:  
  ```
  {xs: ['bucketed_revenue'], metrics: [{metric: 'average', column: 'did_order'}], title: 'Conversion Rate from Cart to Order by Revenue', color_bys: [], plot_kind: 'line'}
  ```
  Reasoning: All `did_...` columns contain values of `1` (it happened) and `0` (it did not happen), so calculating the **average** of `did_...` gives the conversion rate.


### IMPORTANT RULES:
- The column in the `metrics` array as well as the values of `xs`, `color_bys` **must** come from the list of columns provided by the user.  
- You cannot have a `color_by` without a `xs`.
- If the `count_all` metric is used, the column **must** be `null`.
- **Count Distinct** (`count_distinct`) should only be used when asking for distinct features (e.g., unique IDs), not for totals. For totals (e.g., number of orders), use `count_all` with `column: null`.
- If the user is not asking for a plot_kind then:
  - if `xs` is numeric or timestamp, use the line plot, unless the user is asking for a unique count, then use the bar plot.
  - if `xs` is a string, use the bar plot.
  - if `xs` is empty, use donut plot

### Steps to follow:
1. Review all the examples and understand the reasoning behind the plot configuration.
2. Review the columns and their context.
3. Decide on the `xs` and `color_bys`.
4. Decide on the metrics to use.
   - If the user is asking about totals, counts of events, or number of occurrences (e.g., "how many orders"), use `count_all` with `column: null`.
   - If the user is asking about unique or distinct counts (e.g., "unique people"), use `count_distinct` with the appropriate identifier column.
5. Decide on the plot kind.
6. Return the plot configuration.
