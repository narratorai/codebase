import { DisplayFormat, IRemoteBooleanExpression, LogicalOperator, NumberOperator, StringOperator } from '.'

export enum DetailKind {
  Sql = 'sql',
  Time = 'time',
  Customer = 'customer',
  Activity = 'activity',
  Computed = 'computed',
  Group = 'group',
  Metric = 'metric',
  AggregateDim = 'aggregate_dim',
}

export enum AggregateFunction {
  CountAll = 'count_all',
  Count = 'count',
  CountDistinct = 'count_distinct',
  Sum = 'sum',
  Average = 'average',
  Max = 'max',
  Min = 'min',
  Stddev = 'stddev',
  Median = 'median',
  PercentileCont = 'percentile_cont',
  Rate = 'rate',
  ListAggregateUnique = 'list_agg_unique',
  ListAggregate = 'list_agg',
}

export enum ColumnType {
  String = 'string',
  Timestamp = 'timestamp',
  Number = 'number',
  Boolean = 'boolean',
}

export enum QuickFunction {
  Hour = 'hour',
  Day = 'day',
  Week = 'week',
  Month = 'month',
  Quarter = 'quarter',
  Year = 'year',
  Exists = 'exists',
}

export interface IRemotePivotColumn {
  columnId: string
  value: string | boolean | number | null
}

export interface IRemoteActivitySourceDetails {
  activityId: string
  appliedFunction: string | null
  dimId: string | null
  kind: DetailKind
  name: string
  percentile: number | null
  type: ColumnType | null
}

export interface IRemoteCustomerDetails {
  customerDimId: string
  kind: DetailKind
  name: string
}

export interface IRemoteSQLDetails {
  field: string
  kind: DetailKind
}

export interface IRemoteComputedDetails {
  activityId: string | null
  formConfig: Record<string, unknown> | null
  kind: DetailKind
  rawStr: string
  usedCustomFunctions: boolean
}

export interface IRemoteCohortTimeDetails {
  kind: DetailKind
}

export interface IRemoteMetricsDetails {
  aggFunction: AggregateFunction
  columnId: string | null
  conditionedOnColumns: string[] | null
  kind: DetailKind
  percentile: number | null
  pivotedOn: IRemotePivotColumn[] | null
}

export interface IRemoteGroupDetails {
  columnId: string
  kind: DetailKind
  pivoted: boolean
  useAsColumn?: boolean
}

export interface IRemoteAggregateDetails {
  aggregateDimId: string
  kind: DetailKind
  name: string
}

export interface IRemoteColumn {
  displayFormat: DisplayFormat
  examples: string[]
  filters: IRemoteBooleanExpression | null
  id: string
  label: string
  output: boolean
  type: ColumnType
}

export interface IRemotePrefilterColumn {
  applyQuickFunction: QuickFunction | null
  details: IRemoteActivitySourceDetails | IRemoteCustomerDetails
  examples: string[]
  filters: IRemoteBooleanExpression | null
  label: string
  type: ColumnType
}

export interface IRemoteJoinConditon {
  cohortColumn: IRemotePrefilterColumn
  column: IRemotePrefilterColumn
  operator: StringOperator | NumberOperator
}

export interface IRemoteJoinConditonExpression {
  logicalOperator: LogicalOperator
  operands: (IRemoteJoinConditonExpression | IRemoteJoinConditon)[]
}

export interface IRemoteParentColumn extends IRemoteColumn {
  applyQuickFunction: QuickFunction | null
  autoMetrics: string[]
  details:
    | IRemoteActivitySourceDetails
    | IRemoteCustomerDetails
    | IRemoteSQLDetails
    | IRemoteComputedDetails
    | IRemoteCohortTimeDetails
}

export interface IRemoteGroupColumn extends IRemoteColumn {
  details: IRemoteMetricsDetails | IRemoteGroupDetails | IRemoteComputedDetails | IRemoteAggregateDetails
}

export interface IRemoteOrder {
  asc: boolean
  columnId: string
}

export interface IRemoteDimensionJoin {
  foreignKey: string
  idKey: string
  type: ColumnType
}

export interface IRemoteDimension {
  dimId: string | null
  id: string
  join: IRemoteDimensionJoin
  schemaName: string | null
  slowlyChangingTs: string | null
  table: string
}

export interface IRemoteAggregateDimensionJoin {
  applyComputedLogic: boolean
  columnId: string
  idKey: string
}

export interface IRemoteAggregateDimension {
  dimId: string | null
  distributeUsingColumnId: string | null
  id: string
  joins: IRemoteAggregateDimensionJoin[]
  schemaName: string | null
  table: string
}
