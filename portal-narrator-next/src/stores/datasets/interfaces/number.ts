export enum NumberOperator {
  GreaterThan = 'greater_than',
  GreaterThanOrEqual = 'greater_than_equal',
  LessThan = 'less_than',
  LessThanOrEqual = 'less_than_equal',
  Equal = 'equal',
  NotEqual = 'not_equal',
}

export enum NumberArrayOperator {
  IsIn = 'is_in',
  NotIsIn = 'not_is_in',
}

export interface IRemoteNumberFilter {
  operator: NumberOperator
  value: number
}

export interface IRemoteNumberArrayFilter {
  operator: NumberArrayOperator
  values: number[]
}
