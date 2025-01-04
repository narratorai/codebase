import { App, Spin } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { FAVORITES, INDEX_SIDEBAR_WIDTH, RECENTLY_VIEWED } from 'components/shared/IndexPages/constants'
import { getSharedCompanyTags } from 'components/shared/IndexPages/helpers'
import IndexSidebar from 'components/shared/IndexPages/IndexSidebar'
import { LayoutContent } from 'components/shared/layout/LayoutWithFixedSider'
import Page from 'components/shared/Page'
import { IStatus_Enum, useListCompanyTagsQuery, useListDatasetsQuery } from 'graph/generated'
import { each, get, includes, isEqual, keys } from 'lodash'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { generatePath, RouteComponentProps } from 'react-router'
import usePrevious from 'util/usePrevious'

import DatasetIndexContext from './DatasetIndexContext'
import DatasetIndexSection from './DatasetIndexSection'
import { makeDatasetTabMap } from './helpers'
import { DatasetFromQuery } from './interfaces'
import DeleteDatasetModal from './Modals/DeleteDatasetModal'
import DuplicateDatasetModal from './Modals/DuplicateDatasetModal'
import SaveDatasetModal from './Modals/SaveDatasetModal'

enum OverlayNames {
  DATASET_OVERLAY_UPDATE = 'update',
  DATASET_OVERLAY_DUPLICATE = 'duplicate',
  DATASET_OVERLAY_DELETE = 'delete',
}

interface OverlayProps {
  name: OverlayNames
  dataset: DatasetFromQuery
}

export const DEFAULT_ALLOWED_STATUSES = [IStatus_Enum.InProgress, IStatus_Enum.Live]

type Props = RouteComponentProps<{ filter?: string }>

const DatasetIndex = ({ match, history }: Props) => {
  const { notification } = App.useApp()
  const company = useCompany()
  const { user, isSuperAdmin } = useUser()
  const filterFromUrl = match?.params?.filter
  const menuFilter = filterFromUrl || RECENTLY_VIEWED
  const prevMenuFilter = usePrevious(menuFilter)

  const [overlay, setOverlay] = useState<OverlayProps | null>(null)

  const navigateIndex = useCallback(
    (filterId = RECENTLY_VIEWED) => {
      if (!match) {
        return
      }

      const newPath = generatePath('/:company_slug/datasets/:filter?', {
        ...match.params,
        company_slug: get(match, 'params.company_slug'),
        filter: encodeURI(filterId),
      })

      history.push(newPath)
    },
    [match, history]
  )

  const { data: tagsResult, loading: tagsLoading } = useListCompanyTagsQuery({
    variables: { company_id: company?.id, user_id: user.id },
    fetchPolicy: 'cache-and-network',
  })
  const tags = tagsResult?.company_tags || []
  const sharedTags = useMemo(() => getSharedCompanyTags(tags), [tags])

  const {
    data: datasets,
    loading: datasetsLoading,
    error: datasetsError,
    refetch: refetchDatasets,
  } = useListDatasetsQuery({
    variables: { company_id: company?.id, statuses: DEFAULT_ALLOWED_STATUSES, user_id: user?.id },
    notifyOnNetworkStatusChange: true,
    // This makes sure data reloads every time
    // the page loads (solves create/delete inconsistencies)
    fetchPolicy: 'cache-and-network',
  })

  useEffect(() => {
    if (datasetsError) {
      notification.error({
        key: 'fetch-dataset-error',
        message: 'Error Fetching Datasets',
        description: datasetsError?.message,
      })
    }
  }, [datasetsError, notification])

  const handleRefetchDataset = useCallback(async () => {
    await refetchDatasets()
  }, [refetchDatasets])

  // refetch datasets if switching to favorites tab
  // (we optimistically (un)favorite datasets - refetch to show actual favorited)
  useEffect(() => {
    if (prevMenuFilter && !isEqual(prevMenuFilter, menuFilter) && menuFilter === FAVORITES) {
      handleRefetchDataset()
    }
  }, [prevMenuFilter, menuFilter, handleRefetchDataset])

  const showableDatasetsMap = useMemo(
    () => makeDatasetTabMap({ user, datasets: datasets?.dataset || [], isSuperAdmin }) || [],
    [user, datasets?.dataset, isSuperAdmin]
  )

  const showableDatasetsKeys = useMemo(() => keys(showableDatasetsMap), [showableDatasetsMap])

  const allMenuFilters = useMemo(() => {
    const menuFilters = new Set<string>([])
    // these won't include tags that exist, but have no datasets
    each(showableDatasetsKeys, (key) => {
      menuFilters.add(key)
    })
    // make sure tags, without datasets are accounted for
    each(sharedTags, (tag) => menuFilters.add(tag.id))

    return [...menuFilters]
  }, [showableDatasetsKeys, sharedTags])

  // make sure filter from url exists
  useEffect(() => {
    // default to "Recently Viewed" if invalid url filter
    if (!includes(allMenuFilters, filterFromUrl) && !tagsLoading) {
      history.push(`/${company?.slug}/datasets/${RECENTLY_VIEWED}`)
    }
  }, [filterFromUrl, allMenuFilters, company?.slug, history, tagsLoading])

  const showableDatasets = showableDatasetsMap[menuFilter]

  const handleCloseOverlay = () => {
    setOverlay(null)
  }

  const handleUpdateSuccess = () => {
    handleCloseOverlay()
    handleRefetchDataset()
  }

  const handleOpenEditDataset = useCallback((dataset: DatasetFromQuery) => {
    setOverlay({ name: OverlayNames.DATASET_OVERLAY_UPDATE, dataset })
  }, [])

  const handleOpenDuplicateDataset = useCallback((dataset: DatasetFromQuery) => {
    setOverlay({ name: OverlayNames.DATASET_OVERLAY_DUPLICATE, dataset })
  }, [])

  const handleOpenDeleteDataset = useCallback((dataset: DatasetFromQuery) => {
    setOverlay({ name: OverlayNames.DATASET_OVERLAY_DELETE, dataset })
  }, [])

  return (
    <Page
      title="Datasets | Narrator"
      bg="white"
      breadcrumbs={[{ text: 'Datasets' }]}
      style={{ height: '100vh', overflowY: 'hidden' }}
    >
      <DatasetIndexContext.Provider
        value={{
          datasets: datasets?.dataset,
          datasetsLoading,
          handleOpenEditDataset: handleOpenEditDataset,
          handleOpenDuplicateDataset: handleOpenDuplicateDataset,
          handleOpenDeleteDataset: handleOpenDeleteDataset,
          tags,
          tagsLoading,
          sharedTags,
          selectedFilter: menuFilter,
        }}
      >
        <IndexSidebar title="Datasets" tags={sharedTags} activeMenuItem={menuFilter || ''} onClick={navigateIndex} />

        <LayoutContent
          data-public
          siderWidth={INDEX_SIDEBAR_WIDTH}
          style={{ height: '100%', overflowY: 'hidden', boxShadow: 'none' }}
        >
          <Spin spinning={datasetsLoading}>
            {/* key helps reset the table/filters when switching high level filters
                i.e. Recently Viewed -> Favorites
            */}
            <DatasetIndexSection datasets={showableDatasets} key={menuFilter} />
          </Spin>
        </LayoutContent>

        {/* Overlays */}
        {overlay?.name === OverlayNames.DATASET_OVERLAY_UPDATE && overlay?.dataset && (
          <SaveDatasetModal
            dataset={overlay.dataset}
            onClose={handleCloseOverlay}
            onUpdateSuccess={handleUpdateSuccess}
          />
        )}

        {overlay?.name === OverlayNames.DATASET_OVERLAY_DUPLICATE && overlay.dataset && (
          <DuplicateDatasetModal dataset={overlay.dataset} onClose={handleCloseOverlay} />
        )}

        {overlay?.name === OverlayNames.DATASET_OVERLAY_DELETE && overlay.dataset && (
          <DeleteDatasetModal
            dataset={overlay.dataset}
            onClose={handleCloseOverlay}
            refetchDatasets={handleRefetchDataset}
          />
        )}
      </DatasetIndexContext.Provider>
    </Page>
  )
}

export default DatasetIndex
