import { AntVPlotConfigs } from 'components/shared/AntVPlots/interfaces'
import { IDatasetQueryDefinition } from 'util/datasets/interfaces'

export type PlotData = AntVPlotConfigs['data']
export type AllPlotConfig = { [key: string]: PlotData }

export interface IDatasetStoryContext {
  datasetSlug: string
  queryDefinition: IDatasetQueryDefinition
  allPlotConfig: AllPlotConfig
  setAllPlotConfig: (allPlotConfig: AllPlotConfig) => void
}
