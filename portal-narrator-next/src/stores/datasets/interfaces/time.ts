export enum TimeReference {
  Relative = 'relative',
  Absolute = 'absolute',
  StartOf = 'start_of',
}

export enum TimeResolution {
  Second = 'second',
  Minute = 'minute',
  Hour = 'hour',
  Day = 'day',
  Week = 'week',
  Month = 'month',
  Quarter = 'quarter',
  Year = 'year',
  SecondBoundary = 'second_boundary',
  MinuteBoundary = 'minute_boundary',
  HourBoundary = 'hour_boundary',
  DayBoundary = 'day_boundary',
  WeekBoundary = 'week_boundary',
  MonthBoundary = 'month_boundary',
  QuarterBoundary = 'quarter_boundary',
  YearBoundary = 'year_boundary',
}

export enum TimeOperator {
  TimeRange = 'time_range',

  // we needed the ones below for backfilling
  Equal = 'equal',
  NotEqual = 'not_equal',
  GreaterThan = 'greater_than',
  LessThan = 'less_than',
  GreaterThanEqual = 'greater_than_equal',
  LessThanEqual = 'less_than_equal',
}

export enum CohortTimeKind {
  AllStart = 'all_start',
  AllEnd = 'all_end',
  Last = 'last',
  This = 'this',
}

export enum Refinement {
  Within = 'within',
  AtLeast = 'at_least',
}

export interface IRemoteRelativeTimeDetails {
  resolution: TimeResolution
  value: number
}

export interface IRemoteRefinementTimeDetails extends IRemoteRelativeTimeDetails {
  kind: Refinement
}

export interface IRemoteAbsoluteTimeDetails {
  dateTime: string
}

export interface IRemoteStartOfTimeDetails {
  resolution: TimeResolution
}

export interface IRemoteTimeCondition {
  details: IRemoteRelativeTimeDetails | IRemoteAbsoluteTimeDetails | IRemoteStartOfTimeDetails
  reference: TimeReference
}

export interface IRemoteTimeFilter {
  fromCondition: IRemoteTimeCondition | null
  operator: TimeOperator
  timeValue: string | null
  toCondition: IRemoteTimeCondition | null
}
