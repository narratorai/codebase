import { DatasetFromQuery, DatasetsFromQuery } from 'components/Datasets/interfaces'
import {
  ALL_MINE,
  ALL_SHARED,
  DRAFTS,
  EVERYTHING,
  FAVORITES,
  POPULAR,
  RECENTLY_VIEWED,
  SUPER_ADMIN_ALL_DRAFTS,
} from 'components/shared/IndexPages/constants'
import { IStatus_Enum, IUser } from 'graph/generated'
import { each, filter, find, has, orderBy, sortBy } from 'lodash'

interface MakeDatasetTabMapProps {
  user: IUser
  datasets: DatasetsFromQuery
  isSuperAdmin: boolean
}

export const makeDatasetTabMap = ({ user, datasets, isSuperAdmin }: MakeDatasetTabMapProps) => {
  const datasetGroups: Record<string, any[]> = {}
  datasetGroups[DRAFTS] = []
  datasetGroups[SUPER_ADMIN_ALL_DRAFTS] = []
  datasetGroups[FAVORITES] = []
  datasetGroups[EVERYTHING] = []
  datasetGroups[RECENTLY_VIEWED] = []
  datasetGroups[POPULAR] = []
  datasetGroups[ALL_SHARED] = []
  datasetGroups[ALL_MINE] = []

  each(datasets, (dataset) => {
    // sort by status
    //// FIXME/TODO: account for super admin internal only / archived
    if (dataset.status === IStatus_Enum.Archived || dataset.status === IStatus_Enum.InternalOnly) {
      return
    }

    // If it's not archived nor internal only - add it to everything
    datasetGroups[EVERYTHING].push(dataset)

    //// Draft as non-Super Admin
    if (dataset.status === IStatus_Enum.InProgress && !isSuperAdmin) {
      datasetGroups[DRAFTS].push(dataset)
    }

    // Draft as Super Admin
    if (dataset.status === IStatus_Enum.InProgress && isSuperAdmin) {
      // only push owned datasets to regular drafts
      if (user.id === dataset.created_by) {
        datasetGroups[DRAFTS].push(dataset)
      }

      // push all drafts to super admin (all drafts)
      datasetGroups[SUPER_ADMIN_ALL_DRAFTS].push(dataset)
    }

    //// Shared
    if (dataset.status === IStatus_Enum.Live) {
      datasetGroups[ALL_SHARED].push(dataset)
    }

    //// Check if it belongs to the user
    if (user.id === dataset.created_by) {
      datasetGroups[ALL_MINE].push(dataset)
    }

    ////
    // Check dataset's tags for favorites/recently viewed/popular/ or any custom tag they've made
    each(dataset.tags, (tag) => {
      const companyTag = tag.company_tag
      const companyTagId = companyTag?.id

      if (companyTag) {
        // Check if favorited
        if (companyTag.tag === FAVORITES) {
          datasetGroups[FAVORITES].push(dataset)
          // Check if recently viewed
        } else if (companyTag.tag === RECENTLY_VIEWED) {
          datasetGroups[RECENTLY_VIEWED].push(dataset)
          // Check if Popular
        } else if (companyTag.tag === POPULAR) {
          datasetGroups[POPULAR].push(dataset)
          // Check for all other - non reserved tags
          // These would be created by the company/user (i.e. Marketing, Sales, Sales Engineers ...)
        } else if (companyTagId) {
          // instantiate key if first time adding the tag
          if (!has(datasetGroups, companyTagId)) {
            datasetGroups[companyTagId] = []
          }
          datasetGroups[companyTagId].push(dataset)
        }
      }
    })
  })

  // order recently viewed by last view
  datasetGroups[RECENTLY_VIEWED] = orderBy(
    datasetGroups[RECENTLY_VIEWED],
    (dataset) => find(dataset.tags, ['company_tag.tag', RECENTLY_VIEWED])?.updated_at,
    'desc'
  )

  return datasetGroups
}

export const isDatasetFavorited = (dataset: DatasetFromQuery) => !!find(dataset.tags, ['company_tag.tag', FAVORITES])

export const sortDatasetsByRecentlyViewed = (datasets?: DatasetsFromQuery) => {
  // First sort by the user's recently viewed tag
  const recentlyViewedByUser = filter(datasets, (dataset) => !!find(dataset.tags, ['company_tag.tag', RECENTLY_VIEWED]))
  const sortedRecentlyViewedByUser = sortBy(
    recentlyViewedByUser,
    (dataset) => find(dataset.tags, ['company_tag.tag', RECENTLY_VIEWED])?.updated_at
  ).reverse()

  // Then use whatever default sorting was passed down for datasets
  // for non-recently viewed datasets
  const notRecentlyViewedByUser = filter(
    datasets,
    (dataset) => !find(dataset.tags, ['company_tag.tag', RECENTLY_VIEWED])
  )

  return [...sortedRecentlyViewedByUser, ...notRecentlyViewedByUser]
}
