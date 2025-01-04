import { IListRequestsQuery } from 'graph/generated'

export type Requests = IListRequestsQuery['training_request']
export type Request = Requests[number]

export enum VisibleRequestTypes {
  All = 'all',
  MyOutstanding = 'mine',
  Outstanding = 'outstanding',
}
