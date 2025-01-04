import { ApolloQueryResult } from '@apollo/client'
import { ICompany_Task, IListWatchersQuery, IWatcher } from 'graph/generated'

export type PlotTimes = 'user_time' | 'company_time'

export interface BasicTabProps {
  tasks?: ICompany_Task[]
}

export interface ITaskTrackerContext {
  resolution: string
  duration: number
  handleUpdateDurationResolution: ({ duration, resolution }: { duration: number; resolution: string }) => void
  plotTime: PlotTimes
  setPlotTime: (plotTime: PlotTimes) => void
  taskWatchers?: Partial<IWatcher>[]
  refetchWatchers?: ({ user_id }: { user_id: any }) => Promise<ApolloQueryResult<IListWatchersQuery>>
  processingIsPaused: boolean
}
