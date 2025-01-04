import { ITag } from 'components/shared/IndexPages/interfaces'
import { IListNarrativesV3Query } from 'graph/generated'

export type NarrativesType = IListNarrativesV3Query['narrative']
export type NarrativeType = NarrativesType[number]

export interface INarrativeIndexContext {
  narratives?: NarrativesType
  narrativesLoading?: boolean
  handleOpenSaveTemplateOverlay: () => void
  handleOpenUpdateOverlay: (narrative: NarrativeType) => void
  handleOpenDeleteOverlay: (narrative: NarrativeType) => void
  handleOpenConfigOverlay: (narrative: NarrativeType) => void
  handleOpenDuplicateOverlay: (narrative: NarrativeType) => void
  handleCloseOverlay: () => void
  refetchNarratives: () => void
  sharedTags?: ITag[]
  tagsLoading?: boolean
}
