import { IListDatasetsQuery } from 'graph/generated'
import { ITag } from 'components/shared/IndexPages/interfaces'

//////
// TODO: Move this to v3 folder when we remove v2
//////

export type DatasetsFromQuery = IListDatasetsQuery['dataset']
export type DatasetFromQuery = DatasetsFromQuery[number]

export interface IDatasetIndexContext {
  datasets?: DatasetsFromQuery
  datasetsLoading?: boolean // v3 only
  handleOpenEditDataset: (dataset: DatasetFromQuery) => void
  handleOpenDuplicateDataset: (dataset: DatasetFromQuery) => void
  handleOpenDeleteDataset: (dataset: DatasetFromQuery) => void
  // tags,tagsLoading,  sharedTags, selectedFilter are only for the new dataset index (v3)
  tags?: ITag[]
  tagsLoading?: boolean
  sharedTags?: ITag[]
  // selectedFilter is the menu you're on (i.e. Drafts, All Mine...)
  selectedFilter?: string
}
