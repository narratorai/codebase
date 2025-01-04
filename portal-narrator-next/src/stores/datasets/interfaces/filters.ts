import {
  IRemoteBooleanFilter,
  IRemoteNullFilter,
  IRemoteNumberArrayFilter,
  IRemoteNumberFilter,
  IRemoteStringArrayFilter,
  IRemoteStringFilter,
  IRemoteTimeFilter,
  LogicalOperator,
  NumberArrayOperator,
  NumberOperator,
  StringArrayOperator,
  StringOperator,
} from '.'

export interface IRemoteVariableFilter {
  operator: StringOperator | StringArrayOperator | NumberOperator | NumberArrayOperator
  variable: string
}

export type IRemoteAnyFilter =
  | IRemoteTimeFilter
  | IRemoteNullFilter
  | IRemoteNumberFilter
  | IRemoteNumberArrayFilter
  | IRemoteStringFilter
  | IRemoteStringArrayFilter
  | IRemoteBooleanFilter
  | IRemoteVariableFilter

export interface IRemoteColumnToColumnFilter {
  columnId: string
  operator: NumberOperator | StringOperator
}

export interface IRemoteBooleanExpression {
  isNot: boolean
  logicalOperator: LogicalOperator
  operands: (IRemoteBooleanExpression | IRemoteAnyFilter | IRemoteColumnToColumnFilter)[]
}

export interface IRemoteParentFilter {
  columnId: string
  filter: IRemoteAnyFilter | IRemoteColumnToColumnFilter
}

export interface IRemoteParentFilterExpression {
  logicalOperator: LogicalOperator
  operands: (IRemoteParentFilterExpression | IRemoteParentFilter)[]
}
