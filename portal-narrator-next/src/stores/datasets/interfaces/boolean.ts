export enum BooleanOperator {
  Equal = 'equal',
  NotEqual = 'not_equal',
}

export enum LogicalOperator {
  AND = 'AND',
  OR = 'OR',
}

export interface IRemoteBooleanFilter {
  operator: BooleanOperator
  value: boolean
}
