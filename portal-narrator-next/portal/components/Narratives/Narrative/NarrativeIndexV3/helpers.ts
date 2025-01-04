import { startCase, find, max, orderBy } from 'lodash'
import { IStatus_Enum } from 'graph/generated'
import { NARRATIVE_STATUS_LABELS } from './constants'
import { FAVORITES, RECENTLY_VIEWED } from 'components/shared/IndexPages/constants'
import { NarrativesType } from './interfaces'

// Safety check on adding new status that's not in constants
interface IGetNarrativeStatusLabel {
  status: IStatus_Enum
}
export const getNarrativeStatusLabel = ({ status }: IGetNarrativeStatusLabel) => {
  // can fall back to startcase of the value
  return NARRATIVE_STATUS_LABELS[status] || startCase(status)
}

// Narratives are sorted by:
// 1. Favorited
// 2. Recently Viewed or Created At (whichever is first)
export const sortNarratives = (narratives?: NarrativesType) => {
  // make copy of all narratives
  // with _favorite and _recentlyViewed properties for easy sorting
  const narrativesWithMeta = narratives?.map((narrative) => {
    const favoriteTag = find(narrative.tags, ['company_tag.tag', FAVORITES])
    const recentlyViewedTag = find(narrative.tags, ['company_tag.tag', RECENTLY_VIEWED])

    return {
      ...narrative,
      _favorite: favoriteTag?.updated_at || '1', // default to 1 so it's always last
      _recentlyViewedOrCreatedAt: max([recentlyViewedTag?.updated_at, narrative.created_at]),
    }
  })

  const orderedNarratives = orderBy(narrativesWithMeta, ['_favorite', '_recentlyViewedOrCreatedAt'], ['desc', 'desc'])

  return orderedNarratives
}
