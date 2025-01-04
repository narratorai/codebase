export enum StringOperator {
  Contains = 'contains',
  StartsWith = 'starts_with',
  EndsWith = 'ends_with',
  GreaterThan = 'greater_than',
  LessThan = 'less_than',
  GreaterThanOrEqual = 'greater_than_equal',
  LessThanOrEqual = 'less_than_equal',
  Equal = 'equal',
  IsEmpty = 'is_empty',
  NotIsEmpty = 'not_is_empty',
  NotEqual = 'not_equal',
  NotContains = 'not_contains',
  NotStartsWith = 'not_starts_with',
  NotEndsWith = 'not_ends_with',
}

export enum StringArrayOperator {
  ContainsAny = 'contains_any',
  NotContainsAny = 'not_contains_any',
  IsIn = 'is_in',
  NotIsIn = 'not_is_in',
}

export interface IRemoteStringFilter {
  operator: StringOperator
  value: string
}

export interface IRemoteStringArrayFilter {
  operator: StringArrayOperator
  values: string[]
}

export interface IRemoteStringConstraintFilter extends IRemoteStringFilter {
  constraints: string[]
}

export interface IRemoteStringArrayConstraintFilter extends IRemoteStringArrayFilter {
  constraints: string[]
}
