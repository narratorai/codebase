import { IGetRequestQuery } from 'graph/generated'

type Requests = IGetRequestQuery['training_request']
export type ViewRequest = Requests[number]
