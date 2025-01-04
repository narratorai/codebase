import { faker } from '@faker-js/faker'
import { noop } from 'lodash'
import { makeFactory } from 'factory.ts'

export default makeFactory({
  activityStream: faker.company.name(),
  activitiesLoading: false,
  // dataset: any //TODO
  datasetSlug: faker.company.name(),
  // datasetApiStates: IDatasetReducerState
  // groupIndex?: number | null
  // groupSlug?: string | null
  handleToggleSensitiveInfo: noop,
  handleToggleShowJson: noop,
  handleOpenIntegrationOverlay: noop,
  hasMultipleStreams: false,
  obscureSensitiveInfo: false,
  onOpenToolOverlay: noop,
  onRunDataset: noop,
  // selectedApiData: ITabApiData
  // parentApiData will only be set when the parent is run
  // useful for autocomplete group parent filters
  // parentApiData?: ITabApiData
  // streamActivities: IActivity[]
  // toolOverlay: string | null
  hasSubmittedDefinition: true,
})
