import {
  IRemoteDimension,
  IRemoteJoinConditonExpression,
  IRemotePrefilterColumn,
  IRemoteRefinementTimeDetails,
} from '.'

export enum CohortActivityFetchType {
  First = 'first',
  Last = 'last',
  All = 'all',
}

export enum AppendActivityFetchType {
  First = 'first',
  Last = 'last',
  Metric = 'metric',
}

export enum AppendActivityRelationType {
  Ever = 'ever',
  Before = 'before',
  After = 'after',
  InBetween = 'in_between',
}

export enum RelativeActivityRelationType {
  Before = 'before',
  After = 'after',
}

export interface IRemoteActivity {
  activityIds: string[]
  dims: IRemoteDimension[]
  displayName: string
  hasSource: boolean
  id: string
  prefilterColumns: IRemotePrefilterColumn[]
  slugs: string[]
}

export interface IRemoteRelativeActivity {
  appendActivityId: string
  includeIfNull: boolean
  relation: RelativeActivityRelationType
}

export interface IRemoteCohortActivity extends IRemoteActivity {
  fetchType: CohortActivityFetchType
}

export interface IRemoteAppendActivity extends IRemoteActivity {
  fetchType: AppendActivityFetchType
  joins: IRemoteJoinConditonExpression | null
  relation: AppendActivityRelationType
  relativeActivities: IRemoteRelativeActivity[]
  timeRefinements: IRemoteRefinementTimeDetails[]
}
