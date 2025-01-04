# GOAL

Given a question and a list of table columns, determine if any columns are needed to answer the question. Only consider the columns needed before the GROUP BY.

The columns will be written in our custom language which maps to a SQL query.


## STEP-BY-STEP PROCESS
1. **Understand the examples** - Go through the examples and understand the pattern and the reasoning behind the output.
2. Go through the question and understand the user's intention.
3. Given the columns and they **context** think about how you would write a SQL query to answer the question.
4. Given the functions available, write the function in our custom language.
5. Return the function and a good name for the column.


## Functions available

date_add: "DATE_ADD('{datepart}', {number}, {column})"
date_diff_boundary: "DATE_DIFF('{datepart}', {from_column}, {to_column})"
date_trunc:"DATE_TRUNC('{datepart}', {column})"
nvl:"NVL({first_column}, {second_column})"
decimate_number:"FLOOR({column}/{number}) * {number}"

For CASE WHEN statements, you can use the following functions:
"iff({condition}, {if_true}, {if_false})"
This can be nested like 'iff({condition}, {if_true}, iff({condition_2}, {if_true_2}, {if_false}))'
This compiles to a `CASE WHEN conidtion THEN if_true WHEN condition_2 THEN if_true_2 ELSE if_false END


### Examples of using the functions
- SQL: "DATE_ADD('month', 1, created_date)"
- Custom Language: "date_add('month', 1, created_date)"

- SQL: "CASE WHEN created_date is NULL THEN 1 ELSE 0 END"
- Custom Language: "iff(created_date is None, 1, 0)"
NOTE: In the custom language, None is used instead of NULL

- SQL: "CASE WHEN DATE_DIFF('week', from_col, to_col) > 10 THEN '>10' WHEN DATE_DIFF('week', from_col, to_col) > 2 THEN '2-10' ELSE '<2' END"
- Custom Language: "iff(date_diff_boundary('week', from_col, to_col) > 10, '>10', iff(date_diff_boundary('week', from_col, to_col) > 2, '2-10', '<2'))"



### INPUT EXAMPLES:
- **Question**: How many unique people called us?  
  **Columns**:
    - From `first` time a customers did started call
      - month (timestamp)
      - revenue (number)
      - customer_id (string)
    etc.

- **Question**: What is the total first time order revenue for each month?  
  **Columns**:
    - From `first` time a customers did completed order
      - month (timestamp)
      - revenue (number)
      - customer_id (string)
    etc.

- **Question**: What is the revenue for first-time buyers and second-time buyers?  
  **Columns**:
    - From `first` time a customers did completed order
      - month (timestamp)
      - revenue (number)
      - customer_id (string)
      - activity_occurrence (number)
    - We then derived the following columns
      - buyer_type (string)
    etc.

- **Question**: How many orders did we get?  
  **Columns**:
    - From `all` time a customers did completed order
      - activity_id (string)
      - revenue (number)
      - order_id (string)
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
  {columns: []}
  ```
  reason: The table all has the columns needed before the GROUP BY so we don't need to add any columns.

- For **What is the total first time order revenue for each month?**
`{columns: []}`
reason: The COHORT activity is already first time orders so we don't need to add any columns.

- For **What is the revenue for first time buyer and second time buyer?**
`{columns: [{equation:(iff(activity_occurrence = 1, 'first_time', iff(activity_occurrence = 2, 'second_time', 'other'))), label: 'buyer_type'}]}`
reason: The user is trying to compare first time buyer and second time buyer so we need to create that column to be used in the GROUP BY.

- For **How many orders did we get?**
`{columns: []}`
reason: A COHORT activity is the list of orders for every customer, so COUNT_ALL will give us the number of orders and thus we do not need to add any columns.


- For **What is the conversion rate from cart to order by the revenue bucketed into groups of 10?**
`{columns: [{equation: (decimate_number(revenue, 10)), label: 'revenue_bucket'}]}`
reason: The user is asking for the conversion rate from cart to order by the revenue bucketed into groups of 10.
**IMPORTANT** The conversion rate can be calculated using the did_order column which is 1 if the customer did order and 0 otherwise, so the AVERAGE will give us the conversion rate.
