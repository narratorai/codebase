import { DatasetMachineState } from 'util/datasets/interfaces'
import { IActivity } from 'graph/generated'

export interface IDatasetDefinitionContext {
  machineCurrent: DatasetMachineState
  machineSend: Function
  activityStream?: string | null
  streamActivities?: IActivity[]
  datasetSlug?: string
  isExplore?: boolean
}
