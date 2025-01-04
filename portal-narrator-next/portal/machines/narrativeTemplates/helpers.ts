import _ from 'lodash'
import { DatasetFeatureMapping, TemplateDatasetConfig } from 'util/narratives/interfaces'

// Map through all dataset options, and build feature_mapping equivalent
export const makeDatasetFeatureMapping = (datasets: TemplateDatasetConfig[]): DatasetFeatureMapping[] => {
  return _.reduce(
    datasets,
    (result: DatasetFeatureMapping[], datasetConfig) => {
      return [
        ...result,
        ..._.map(datasetConfig.feature_mapping, (mapping) => ({
          _dataset_mapping_old_id: datasetConfig.mapping.old_id,
          ...mapping,
        })),
      ]
    },
    [] as DatasetFeatureMapping[]
  )
}
