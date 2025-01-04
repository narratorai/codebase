export enum NullOperator {
  IsNull = 'is_null',
  NotIsNull = 'not_is_null',
}

export interface IRemoteNullFilter {
  operator: NullOperator
}
