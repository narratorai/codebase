import { flatten, map } from 'lodash'
import moment from 'moment'

import { ComputedColumnKind } from './interfaces'

// import { COLUMN_TYPE_NUMBER, COLUMN_TYPE_STRING, COLUMN_TYPE_TIMESTAMP } from 'util/datasets'
/////////////////
// FIXME - SOMETHING BROKE and I don't know why! columnType is undefined in production if I import it from constants
/////////////////
const COLUMN_TYPE_NUMBER = 'number'
const COLUMN_TYPE_STRING = 'string'
const COLUMN_TYPE_TIMESTAMP = 'timestamp'

///////////// KINDS /////////////
// Don't Use these:
// const KIND_TIME_TO_NOW = {
//   kind: 'time_to_now',
// }
// const KIND_COUNT = {
//   kind: 'count',
// }
// const KIND_SUM = {
//   kind: 'sum',
// }
// TIME
export const KIND_TIME_ADD = {
  kind: 'time_add',
  label: 'Time Add',
  description: 'Add time to a timestamp',
  sql: "DATE_ADD('{unit_of_time}', {number}, {time_column})",
  valueType: 'Timestamp',
  columnType: COLUMN_TYPE_TIMESTAMP,
  example: 'Create computed column "Estimated Ship Date" by adding 5 days to the "Order Placed Date"',
  exampleTable: {
    columns: [
      {
        accessor: 'user_name',
        label: 'Customer Name',
        type: 'dataset',
      },
      {
        accessor: 'order_placed',
        label: 'Order Placed',
        type: 'dataset',
      },
      {
        accessor: 'est_ship',
        label: 'Estimated Ship Date',
        type: 'computed',
      },
    ],
    rows: [
      {
        user_name: 'John',
        order_placed: '2017-10-05',
        est_ship: '2017-10-10',
      },
      {
        user_name: 'Josephine',
        order_placed: '2017-09-12',
        est_ship: '2017-09-17',
      },
      {
        user_name: 'Jimmy',
        order_placed: '2017-08-08',
        est_ship: '2017-08-13',
      },
      {
        user_name: 'James',
        order_placed: '2017-07-12',
        est_ship: '2017-07-17',
      },
    ],
  },
}
export const KIND_TIME_TRUNCATE = {
  kind: 'time_truncate',
  label: 'Truncate Time',
  description: 'Truncate (rounds) a timestamp to the specified unit of time',
  sql: "DATE_TRUNC('{unit_of_time}',{time_column})",
  valueType: 'Timestamp',
  columnType: COLUMN_TYPE_TIMESTAMP,
  example: 'Truncate "Order Placed" to get the month the order was placed',
  exampleTable: {
    columns: [
      {
        accessor: 'user_name',
        label: 'Customer Name',
        type: 'dataset',
      },
      {
        accessor: 'order_placed',
        label: 'Order Placed',
        type: 'dataset',
      },
      {
        accessor: 'order_month',
        label: 'Month of Order Placed',
        type: 'computed',
      },
    ],
    rows: [
      {
        user_name: 'John',
        order_placed: '2017-10-05',
        order_month: '2017-10-01',
      },
      {
        user_name: 'Josephine',
        order_placed: '2017-09-12',
        order_month: '2017-09-01',
      },
      {
        user_name: 'Jimmy',
        order_placed: '2017-08-08',
        order_month: '2017-08-01',
      },
      {
        user_name: 'James',
        order_placed: '2017-07-12',
        order_month: '2017-07-01',
      },
    ],
  },
}
export const KIND_TIME_BETWEEN = {
  kind: 'time_between',
  label: 'Time Between',
  description: 'Calculate the elapsed time between two timestamps',
  sql: "DATE_DIFF('{unit_of_time}', {start_time_column}, {end_time_column})",
  valueType: 'Timestamp',
  columnType: COLUMN_TYPE_NUMBER,
  example:
    'Calculate the elapsed time, in days, between "Started Session Timestamp" column and "Completed Order Timestamp" column.',
  exampleTable: {
    columns: [
      {
        accessor: 'stated_sesh',
        label: 'Started Session Ts',
        type: 'dataset',
      },
      {
        accessor: 'completed_ord',
        label: 'Completed Order Ts',
        type: 'dataset',
      },
      {
        accessor: 'time_bet',
        label: 'Time Between in Days',
        type: 'computed',
      },
    ],
    rows: [
      {
        stated_sesh: '2017-10-01',
        completed_ord: '2017-10-05',
        time_bet: '4',
      },
      {
        stated_sesh: '2017-09-01',
        completed_ord: '2017-09-12',
        time_bet: '11',
      },
      {
        stated_sesh: '2017-08-01',
        completed_ord: '2017-08-08',
        time_bet: '7',
      },
      {
        stated_sesh: '2017-07-01',
        completed_ord: '2017-07-12',
        time_bet: '12',
      },
    ],
  },
}

// startDate looks like: [2017, 8, 1]
// no starting zeros, don't do --> [2017, 08, 01]
const getDateDiffDays = (startDate: number[]) => {
  const now = moment(Date.now()).format('YYYY, MM, DD')
  const nowMoment = moment([now])
  return nowMoment.diff(moment(startDate), 'days')
}

// FIXME: Comment at top of file says don't do this?
export const KIND_TIME_TO_NOW = {
  kind: 'time_to_now',
  label: 'Time To Now',
  description: 'Calculate the elapsed time from one timestamp to now',
  sql: "DATE_DIFF('{unit_of_time}', {start_time_column}, {get_date()})",
  valueType: 'Timestamp',
  columnType: COLUMN_TYPE_NUMBER,
  example: 'Calculate the elapsed time, in days, between "Started Session Timestamp" column and now.',
  exampleTable: {
    columns: [
      {
        accessor: 'stated_sesh',
        label: 'Started Session Ts',
        type: 'dataset',
      },
      {
        accessor: 'time_to_now',
        label: 'Time Between in Days',
        type: 'computed',
      },
    ],
    rows: [
      {
        stated_sesh: '2017-10-01',
        time_to_now: getDateDiffDays([2017, 10, 1]),
      },
      {
        stated_sesh: '2017-09-01',
        time_to_now: getDateDiffDays([2017, 9, 1]),
      },
      {
        stated_sesh: '2017-08-01',
        time_to_now: getDateDiffDays([2017, 8, 1]),
      },
    ],
  },
}

export const KIND_DATE_PART = {
  kind: 'date_part',
  label: 'Date Part',
  description: 'Get the Date Part of any time stamp column',
  sql: "DATE_PART('{segment_of_time}', {time_column})",
  valueType: 'Timestamp',
  columnType: COLUMN_TYPE_NUMBER,
  example: 'Grab the month of "Started Session Timestamp".',
  exampleTable: {
    columns: [
      {
        accessor: 'stated_sesh',
        label: 'Started Session Ts',
        type: 'dataset',
      },
      {
        accessor: 'date_part',
        label: 'Date Part Month',
        type: 'computed',
      },
    ],
    rows: [
      {
        stated_sesh: '2017-10-01',
        date_part: '10',
      },
      {
        stated_sesh: '2017-09-01',
        date_part: '9',
      },
      {
        stated_sesh: '2017-08-01',
        date_part: '8',
      },
      {
        stated_sesh: '2017-07-01',
        date_part: '7',
      },
    ],
  },
}

// MATH
export const KIND_MATH_OPERATION = {
  kind: 'math_operation',
  label: 'Math Operation',
  description: 'Perform mathematical operations (multiply, add, etc.) on a numerical column',
  sql: '{column} {mathematical operator} {number}',
  valueType: 'Number',
  columnType: COLUMN_TYPE_NUMBER,
  example: 'Divide "Cost of Meal" by 2 to generate a computed column for "Cost per person"',
  exampleTable: {
    columns: [
      {
        accessor: 'restaurant',
        label: 'Restaurant',
        type: 'dataset',
      },
      {
        accessor: 'cost_meal',
        label: 'Cost of Meal',
        type: 'dataset',
      },
      {
        accessor: 'cost_pp',
        label: 'Cost per Person',
        type: 'computed',
      },
    ],
    rows: [
      {
        restaurant: 'Kahwa',
        cost_meal: '18.5',
        cost_pp: '9.25',
      },
      {
        restaurant: 'Locale',
        cost_meal: '22',
        cost_pp: '11',
      },
      {
        restaurant: 'Evos',
        cost_meal: '201',
        cost_pp: '100.5',
      },
      {
        restaurant: 'Varsity Club',
        cost_meal: '28',
        cost_pp: '14',
      },
    ],
  },
}
export const KIND_MATH_OPERATION_MULTI_COLUMN = {
  kind: 'math_operation_multi_column',
  label: 'Math Operation (Multi-Column)',
  description: 'Perform mathematical operations (multiply, add, etc.) on multiple numerical columns in the dataset',
  sql: '{first_column} {mathematical operator} {second_column}',
  valueType: 'Number',
  columnType: COLUMN_TYPE_NUMBER,
  example: 'Divide "Cost of Meal" by "People" to generate a computed column for "Cost per person"',
  exampleTable: {
    columns: [
      {
        accessor: 'cost_meal',
        label: 'Cost of Meal',
        type: 'dataset',
      },
      {
        accessor: 'people',
        label: 'People',
        type: 'dataset',
      },
      {
        accessor: 'cost_pp',
        label: 'Cost per Person',
        type: 'computed',
      },
    ],
    rows: [
      {
        cost_meal: '18.4',
        people: '4',
        cost_pp: '4.6',
      },
      {
        cost_meal: '22',
        people: '1',
        cost_pp: '22',
      },
      {
        cost_meal: '201',
        people: '5',
        cost_pp: '40.2',
      },
      {
        cost_meal: '28',
        people: '2',
        cost_pp: '14',
      },
    ],
  },
}
// GROOMING
export const KIND_REPLACE = {
  kind: 'replace',
  label: 'Replace',
  description: 'Replace all instances of a string with another string',
  sql: "REPLACE({column}, '{remove_str}', '{replace_str}')",
  valueType: 'String',
  columnType: COLUMN_TYPE_STRING,
  example: 'Replace the string "FL" with "Florida"',
  exampleTable: {
    columns: [
      {
        accessor: 'person',
        label: 'Person',
        type: 'dataset',
      },
      {
        accessor: 'home',
        label: 'Hometown',
        type: 'dataset',
      },
      {
        accessor: 'home_new',
        label: 'Hometown (New)',
        type: 'computed',
      },
    ],
    rows: [
      {
        person: 'Danielle Davis',
        home: 'Palm Harbor, FL',
        home_new: 'Palm Harbor, Florida',
      },
      {
        person: 'Haley Gouletas',
        home: 'FL Keys',
        home_new: 'Florida Keys',
      },
      {
        person: 'Dylan Nolf',
        home: 'Dunedin, Florida',
        home_new: 'Dunedin, Florida',
      },
      {
        person: 'Vanessa Geelan',
        home: 'Holiday, FL',
        home_new: 'Holiday, Florida',
      },
    ],
  },
}
export const KIND_STRING_BETWEEN = {
  kind: 'string_between',
  label: 'String Between',
  description: 'Returns the string between two string parts.',
  sql: "CASE WHEN strpos({column}, '{from_piece}') >0 and strpos({column}, '{to_piece}') >0 THEN SUBSTRING({column}, strpos({column}, '{from_piece}') , strpos({column}, '{to_piece}') - strpos({column}, '{from_piece}') )END",
  valueType: 'String',
  columnType: COLUMN_TYPE_STRING,
  example: 'Extract part of the URL between "/shop" and "/cart"',
  exampleTable: {
    columns: [
      {
        accessor: 'ts',
        label: 'Visit Ts',
        type: 'dataset',
      },
      {
        accessor: 'url',
        label: 'URL',
        type: 'dataset',
      },
      {
        accessor: 'url_part',
        label: 'URL Part',
        type: 'computed',
      },
    ],
    rows: [
      {
        ts: '2018-12-31 00:00:00',
        url: '/shop/deals/cart',
        url_part: '/deals',
      },
      {
        ts: '2018-03-01 00:00:00',
        url: '/shop/holiday/cart/confirm',
        url_part: '/holiday',
      },
      {
        ts: '2018-12-12 00:00:00',
        url: '/d/shop/books/fiction/cart',
        url_part: '/books/fiction',
      },
      {
        ts: '2017-11-02 00:00:00',
        url: '/account/profile/update',
        url_part: 'NULL',
      },
    ],
  },
}
export const KIND_DECIMATE_NUMBER = {
  kind: 'number_decimate',
  label: 'Decimate Number',
  description: 'Returns the lowest number in a specified increment',
  sql: 'FLOOR({column}/{resolution})*{resolution}',
  valueType: 'Number',
  columnType: COLUMN_TYPE_NUMBER,
  example:
    'Bin the age of people into increments of 5 by assigning the number 0 for all people ages 0-4, assigning 5 for all people ages 5-9, etc.',
  exampleTable: {
    columns: [
      {
        accessor: 'name',
        label: 'Name',
        type: 'dataset',
      },
      {
        accessor: 'age',
        label: 'Age',
        type: 'dataset',
      },
      {
        accessor: 'dec_age',
        label: 'Decimate Age by 5',
        type: 'computed',
      },
    ],
    rows: [
      {
        name: 'Shawn Burgoing',
        age: '14',
        dec_age: '10',
      },
      {
        name: 'Kelley Jones',
        age: '25',
        dec_age: '25',
      },
      {
        name: 'Angira Rao',
        age: '11',
        dec_age: '10',
      },
      {
        name: 'Elad Mahor',
        age: '21',
        dec_age: '20',
      },
    ],
  },
}
export const KIND_CONCATENATE_STRING = {
  kind: 'string_concatenate',
  label: 'Concatenate String',
  description: 'Concatenate a string column with another string value',
  sql: "NVL({column},'') || '{string}'",
  valueType: 'String',
  columnType: COLUMN_TYPE_STRING,
  example: 'Append the value "_customer" after the name of each person',
  exampleTable: {
    columns: [
      {
        accessor: 'name',
        label: 'Name',
        type: 'dataset',
      },
      {
        accessor: 'age',
        label: 'Age',
        type: 'dataset',
      },
      {
        accessor: 'new_name',
        label: 'New Name',
        type: 'computed',
      },
    ],
    rows: [
      {
        name: 'Shawn',
        age: '14',
        new_name: 'Shawn_customer',
      },
      {
        name: 'Kelley',
        age: '25',
        new_name: 'Kelley_customer',
      },
      {
        name: 'Angira',
        age: '11',
        new_name: 'Angira_customer',
      },
      {
        name: 'Elad',
        age: '21',
        new_name: 'Elad_customer',
      },
    ],
  },
}
export const KIND_CONCATENATE_STRING_MULTI_COLUMN = {
  kind: 'string_concatenate_multi_column',
  label: 'Concatenate String (Multi-Column)',
  description: 'Concatenate multiple string columns and separate by delimiter string',
  sql: "NVL({column},'') || '{delimiter}' || NVL({second_column},'')",
  valueType: 'String',
  columnType: COLUMN_TYPE_STRING,
  example: 'Append the date of purchase to every purchase description, separated by ", Purchased: " ',
  exampleTable: {
    columns: [
      {
        accessor: 'ts',
        label: 'Purchase Date',
        type: 'dataset',
      },
      {
        accessor: 'descr',
        label: 'Purchase Description',
        type: 'dataset',
      },
      {
        accessor: 'concat',
        label: 'New Purchase Description',
        type: 'computed',
      },
    ],
    rows: [
      {
        ts: '2017-04-29',
        descr: 'Smock in green',
        concat: 'Smock in green, Purchased: 2017-04-29',
      },
      {
        ts: '2017-03-19',
        descr: 'Assorted paint brushes',
        concat: 'Assorted paint brushes, Purchased: 2017-03-19',
      },
      {
        ts: '2017-03-02',
        descr: 'Mason jars',
        concat: 'Mason jars, Purchased: 2017-03-02',
      },
      {
        ts: '2017-03-04',
        descr: 'Gray slate clay',
        concat: 'Gray slate clay, Purchased: 2017-03-04',
      },
    ],
  },
}
// WINDOW
export const KIND_ROW_NUMBER = {
  kind: 'row_number',
  label: 'Row Number',
  description: 'Add a column that numbers a partitioned set of rows in the dataset according to the specified order',
  sql: 'ROW_NUMBER() over (partition by {group_column} order by {order_column})',
  valueType: 'Any',
  columnType: COLUMN_TYPE_NUMBER,
  example: 'Number the website visits in the order they were generated within each source type',
  exampleTable: {
    columns: [
      {
        accessor: 'source',
        label: 'Source',
        type: 'dataset',
      },
      {
        accessor: 'visit_date',
        label: 'Visit Date',
        type: 'dataset',
      },
      {
        accessor: 'row_num',
        label: 'Row Number',
        type: 'computed',
      },
    ],
    rows: [
      {
        source: 'Organic',
        visit_date: '2018-01-01',
        row_num: '1',
      },
      {
        source: 'Organic',
        visit_date: '2018-02-01',
        row_num: '2',
      },
      {
        source: 'Social',
        visit_date: '2018-01-01',
        row_num: '1',
      },
      {
        source: 'Social',
        visit_date: '2018-02-01',
        row_num: '2',
      },
    ],
  },
}
export const KIND_RUNNING_TOTAL = {
  kind: 'running_total',
  label: 'Running Total',
  description:
    'Cumulative sums of a numerical column (in a particular order), applied for each value in another (grouped) column',
  sql: 'SUM({column}) over (partition by {group_column} order by {order} ROWS UNBOUNDED PRECEDING)',
  valueType: 'Number',
  columnType: COLUMN_TYPE_NUMBER,
  example: 'Calculate a running total of revenue',
  exampleTable: {
    columns: [
      {
        accessor: 'timestamp',
        label: 'Timestamp',
        type: 'dataset',
      },
      {
        accessor: 'revenue',
        label: 'Revenue',
        type: 'dataset',
      },
      {
        accessor: 'running_tot',
        label: 'Running Total',
        type: 'computed',
      },
    ],
    rows: [
      {
        timestamp: '2018-08-01',
        revenue: '52.00',
        running_tot: '201.00',
      },
      {
        timestamp: '2018-07-01',
        revenue: '50.00',
        running_tot: '149.00',
      },
      {
        timestamp: '2018-06-01',
        revenue: '51.00',
        running_tot: '99.00',
      },
      {
        timestamp: '2018-05-01',
        revenue: '48.00',
        running_tot: '48.00',
      },
    ],
  },
}
export const KIND_PERCENT_TOTAL = {
  kind: 'percent_of_total',
  label: '% Percent of Total',
  description: 'Show me what percentage of the whole each unique column value accounts for.',
  sql: 'RATIO_TO_REPORT({column}) over (partition by {group})',
  valueType: 'Number',
  columnType: COLUMN_TYPE_NUMBER,
  example: 'For each purchase calculate the % of total revenue, applied within each Coupon Code.',
  exampleTable: {
    columns: [
      {
        accessor: 'coupon_code',
        label: 'Coupon Code',
        type: 'dataset',
      },
      {
        accessor: 'revenue',
        label: 'Revenue',
        type: 'dataset',
      },
      {
        accessor: 'percent_total',
        label: '% of Total Revenue by Ccode',
        type: 'computed',
      },
    ],
    rows: [
      {
        coupon_code: '20OFF',
        revenue: '160.00',
        percent_total: '36.36%',
      },
      {
        coupon_code: '20OFF',
        revenue: '80.00',
        percent_total: '18.18%',
      },
      {
        coupon_code: '50OFF',
        revenue: '50.00',
        percent_total: '11.36%',
      },
      {
        coupon_code: '50OFF',
        revenue: '50.00',
        percent_total: '11.36%',
      },
    ],
  },
}
export const KIND_MOVING_AVERAGE = {
  kind: 'moving_average',
  label: 'Moving Average',
  description: 'Look back on a preceding amount of given rows and calculate the average.',
  sql: 'AVG({column}) over (partition by {group} order by {order} ROWS {window_size} PRECEDING',
  valueType: 'Number',
  columnType: COLUMN_TYPE_NUMBER,
  example: 'Calculate the average "Revenue" over the last rolling 90 days.',
  exampleTable: {
    columns: [
      {
        accessor: 'timestamp',
        label: 'Timestamp',
        type: 'dataset',
      },
      {
        accessor: 'revenue',
        label: 'Revenue',
        type: 'dataset',
      },
      {
        accessor: 'moving_avg',
        label: 'Moving Avg Last 90 Days',
        type: 'computed',
      },
    ],
    rows: [
      {
        timestamp: '08/01/18',
        revenue: '160.00',
        moving_avg: '133.33',
      },
      {
        timestamp: '07/01/18',
        revenue: '120.00',
        moving_avg: '96.67',
      },
      {
        timestamp: '06/01/18',
        revenue: '120.00',
        moving_avg: '85.00',
      },
      {
        timestamp: '05/01/18',
        revenue: '50.00',
        moving_avg: '50.00',
      },
    ],
  },
}
// OTHER
export const KIND_IFTTT = {
  kind: 'ifttt',
  label: 'Conditional IF Statement (IFTTT)',
  description: 'Applies the specified logic if some condition is met. If This Then That.',
  sql: 'CASE WHEN {boolean_condition} THEN {output_if_true} ELSE {output_if_false} END',
  valueType: 'Any',
  columnType: COLUMN_TYPE_STRING,
  example: 'Assign "Days to Convert" into categories: "0-2", "2-100", or "500"',
  exampleTable: {
    columns: [
      {
        accessor: 'days_to_convert',
        label: 'Days to Convert',
        type: 'dataset',
      },
      {
        accessor: 'ifttt_col',
        label: 'IFTTT Column',
        type: 'computed',
      },
    ],
    rows: [
      {
        days_to_convert: '500',
        ifttt_col: '500',
      },
      {
        days_to_convert: '23',
        ifttt_col: '2 - 100',
      },
      {
        days_to_convert: '82',
        ifttt_col: '2 - 100',
      },
      {
        days_to_convert: '1',
        ifttt_col: '0 - 2',
      },
    ],
  },
}
export const KIND_FREEHAND_FUNCTION = {
  kind: 'freehand_function',
  label: 'Freehand Function',
  description:
    "Applies function logic, just like spreadsheets.\n\nType $ to show all functions and columns. Use single quotes (') for strings.",
  sql: `date_diff('day', "timestamp_1", "timestamp_2")`,
  valueType: 'Any',
  columnType: COLUMN_TYPE_STRING,
  example: "date_diff('day', Timestamp1, Timestamp2)",
  exampleTable: {
    columns: [
      {
        accessor: 'cost_meal',
        label: 'Cost of Meal',
        type: 'dataset',
      },
      {
        accessor: 'people',
        label: 'People',
        type: 'dataset',
      },
      {
        accessor: 'cost_pp',
        label: 'Cost per Person',
        type: 'computed',
      },
    ],
    rows: [
      {
        cost_meal: '18.4',
        people: '4',
        cost_pp: '6.6',
      },
      {
        cost_meal: '22',
        people: '1',
        cost_pp: '24',
      },
      {
        cost_meal: '201',
        people: '5',
        cost_pp: '42.2',
      },
      {
        cost_meal: '28',
        people: '2',
        cost_pp: '16',
      },
    ],
  },
}
export const KIND_BIN = {
  kind: 'bin',
  label: 'Bin Columns',
  description: 'Group numerical values into bins based on the conditions applied.',
  sql: 'CASE WHEN {first_bin_condition} THEN {first_bin_name} WHEN {second_bin_condition} THEN {second_bin_name} ... ELSE {other_name} END',
  valueType: 'Number',
  columnType: COLUMN_TYPE_STRING,
  example: 'Create a binned column for “Days to Convert” using bins: “0-2”, “2-100”, “500”',
  exampleTable: {
    columns: [
      {
        accessor: 'days_to_convert',
        label: 'Days to Convert',
        type: 'dataset',
      },
      {
        accessor: 'bin_col',
        label: 'Bin Column',
        type: 'computed',
      },
    ],
    rows: [
      {
        days_to_convert: '500',
        bin_col: '500',
      },
      {
        days_to_convert: '23',
        bin_col: '2 - 100',
      },
      {
        days_to_convert: '82',
        bin_col: '2 - 100',
      },
      {
        days_to_convert: '1',
        bin_col: '0 - 2',
      },
    ],
  },
}

///////////// OTHER /////////////
export const NO_CATEGORY = '_NO_CATEGORY_'
export const COMPUTED_KINDS_BY_CATEGORY = [
  {
    label: 'Time Functions',
    kinds: [KIND_TIME_ADD, KIND_TIME_TRUNCATE, KIND_TIME_BETWEEN, KIND_TIME_TO_NOW, KIND_DATE_PART],
  },
  {
    label: 'Mathematical Operations',
    kinds: [KIND_MATH_OPERATION, KIND_MATH_OPERATION_MULTI_COLUMN, KIND_DECIMATE_NUMBER],
  },
  {
    label: 'String Functions',
    kinds: [KIND_REPLACE, KIND_STRING_BETWEEN, KIND_CONCATENATE_STRING, KIND_CONCATENATE_STRING_MULTI_COLUMN],
  },
  {
    label: 'Window Functions',
    kinds: [KIND_ROW_NUMBER, KIND_RUNNING_TOTAL, KIND_PERCENT_TOTAL, KIND_MOVING_AVERAGE],
  },
  {
    label: NO_CATEGORY,
    kinds: [KIND_IFTTT, KIND_BIN, KIND_FREEHAND_FUNCTION],
  },
]

export const getAllComputedConfigs = () => {
  return flatten(map(COMPUTED_KINDS_BY_CATEGORY as unknown as ComputedColumnKind[], 'kinds'))
}
