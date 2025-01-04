export const SPACE = 1

export const KEYWORDS = {
  the: 'the',
  from: 'from',
  to: 'to',
  where: 'where',
  it_is: 'it is',
  open_parenthesis: '(',
  close_parenthesis: ')',
  ago: 'ago',
  not: 'not',
  or_is_null: 'or is null',
  of_that: 'of that',
  append: 'Append',
  and: 'and',
  add: 'Add',
  plotting: 'Plotting:',
  by: 'by',
  colored_by: 'colored by',
  using: 'using',
  plot: 'plot',
}

export const COHORT_ACTIVITY_FETCH_TYPE = {
  first: 'First',
  last: 'Last',
  all: 'All',
}

export const APPEND_ACTIVITY_FETCH_TYPE = {
  first: 'first',
  last: 'last',
  metric: 'metric',
}

export const APPEND_ACTIVITY_RELATION_TYPE = {
  ever: 'ever',
  before: 'before',
  after: 'after',
  in_between: 'in between',
}

export const RELATIVE_ACTIVITY_RELATION_TYPE = {
  before: 'before',
  after: 'after',
}

export const BOOLEAN_OPERATOR = {
  equal: 'equal',
  not_equal: 'not equal',
}

export const LOGICAL_OPERATOR = {
  AND: 'and',
  OR: 'or',
}

export const COLUMN_TYPE = {
  string: 'string',
  timestamp: 'timestamp',
  number: 'number',
  boolean: 'boolean',
}

export const DISPLAY_FORMAT = {
  percent: 'percent',
  revenue: 'revenue',
  number: 'number',
  month: 'month',
  week: 'week',
  quarter: 'quarter',
  year: 'year',
  time: 'time',
  date: 'date',
  date_short: 'date short',
  id: 'Id',
}

export const DATASET_KIND = {
  activity: 'activity',
  sql: 'sql',
  time: 'time',
}

export const DETAIL_KIND = {
  sql: 'sql',
  time: 'time',
  customer: 'customer',
  activity: 'activity',
  computed: 'computed',
  group: 'group',
  metric: 'metric',
  aggregate_dim: 'aggregate dimension',
}

export const AGGREGATE_FUNCTION = {
  count_all: 'count all',
  count: 'count',
  count_distinct: 'count distinct',
  sum: 'sum',
  average: 'average',
  max: 'max',
  min: 'min',
  stddev: 'stddev',
  median: 'median',
  percentile_cont: 'percentile cont',
  rate: 'rate',
}

export const NULL_OPERATOR = {
  is_null: 'is null',
  not_is_null: 'not is null',
}

export const NUMBER_OPERATOR = {
  greater_than: 'greater than',
  greater_than_equal: 'greater than or equal',
  less_than: 'less than',
  less_than_equal: 'less than or equal',
  equal: 'equal',
  not_equal: 'not equal',
}

export const NUMBER_ARRAY_OPERATOR = {
  is_in: 'is in',
  not_is_in: 'is not in',
}

export const CHART_TYPE = {
  line: 'line',
  column: 'column',
  bar: 'bar',
  pie: 'pie',
  scatter: 'scatter',
  funnel: 'funnel',
  area: 'area',
  rose: 'rose',
  'dual-axes': 'dual axes',
}

export const ANNOTATION_KIND = {
  point: 'point',
  vertical_line: 'vertical line',
  horizontal_line: 'horizontal line',
  color_y_below: 'color y below',
  color_y_above: 'color y above',
  color_x_left: 'color x left',
  color_x_right: 'color x right',
}

export const PLOT_KIND = {
  line: 'line',
  bar: 'bar',
  horizontal_bar: 'horizontal bar',
  stack: 'stack',
  horizontal_bar_stack: 'horizontal bar stack',
  scatter: 'scatter',
  area: 'area',
  funnel: 'funnel',
  rose: 'rose',
  pie: 'pie',
  donut: 'donut',
}

export const REGRESSION = {
  linear: 'linear',
  exp: 'exp',
  loess: 'loess',
  log: 'log',
  poly: 'poly',
  pow: 'pow',
  quad: 'quad',
}

export const STRING_OPERATOR = {
  contains: 'contains',
  starts_with: 'starts with',
  ends_with: 'ends with',
  greater_than: 'greater than',
  less_than: 'less than',
  greater_than_equal: 'greater than or equal',
  less_than_equal: 'less than or equal',
  equal: 'equal',
  is_empty: 'is empty',
  not_is_empty: 'not is empty',
  not_equal: 'not equal',
  not_contains: 'not contains',
  not_starts_with: 'not starts with',
  not_ends_with: 'not ends with',
}

export const STRING_ARRAY_OPERATOR = {
  contains_any: 'contains any',
  not_contains_any: 'not contains any',
  is_in: 'is in',
  not_is_in: 'is not in',
}

export const TAB_KIND = {
  group: 'group',
  parent: 'parent',
}

export const HIDE_SHOW = {
  hide: 'hide',
  show: 'show',
}

export const TIME_REFERENCE = {
  relative: 'relative',
  absolute: 'absolute',
  start_of: 'start of',
}

export const TIME_RESOLUTION = {
  second: 'second',
  minute: 'minute',
  hour: 'hour',
  day: 'day',
  week: 'week',
  month: 'month',
  quarter: 'quarter',
  year: 'year',
  second_boundary: 'second boundary',
  minute_boundary: 'minute boundary',
  hour_boundary: 'hour boundary',
  day_boundary: 'day boundary',
  week_boundary: 'week boundary',
  month_boundary: 'month boundary',
  quarter_boundary: 'quarter boundary',
  year_boundary: 'year boundary',
}

export const TIME_OPERATOR = {
  time_range: 'time range',
}

export const COHORT_TIME_KIND = {
  all_start: 'all start',
  all_end: 'all end',
  last: 'last',
  this: 'this',
}

export const REFINEMENT = {
  within: 'within',
  at_least: 'at least',
}
