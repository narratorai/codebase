import { ClockCircleOutlined, HeartOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons'
import { App, Badge, Empty, Spin } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { FAVORITES, NON_SHARED_TAGS, RECENTLY_VIEWED } from 'components/shared/IndexPages/constants'
import { getSharedCompanyTags } from 'components/shared/IndexPages/helpers'
import { Box, Flex } from 'components/shared/jawns'
import { LayoutContent } from 'components/shared/layout/LayoutWithFixedSider'
import Page from 'components/shared/Page'
import {
  IStatus_Enum,
  useDashboardsUpdatedSubscription,
  useListCompanyTagsQuery,
  useListDashboardsQuery,
} from 'graph/generated'
import { filter, find, includes, isEmpty, isEqual, isFinite, keys, map, sortBy, startCase } from 'lodash'
import { useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import useCallMavis from 'util/useCallMavis'
import usePrevious from 'util/usePrevious'

import CardSection from './CardSection'
import { DASHBOARD_CONTENT_Z_INDEX, DASHBOARD_INDEX_TOP_BAR_HEIGHT } from './constants'
import DashboardIndexContext from './DashboardIndexContext'
import DashboardModals from './DashboardModals'
import { getDashboardsByNonSharedTags } from './helpers'
import { DashboardType, IDashboardImage, OverlayNames, OverlayProps } from './interfaces'
import TopBar from './TopBar'

// make badge a square to give it visual separation
// from AssembledBadge (see narratives/dashboards)
const StyledBadgeContainer = styled.div`
  .antd5-badge-status-dot {
    border-radius: 0 !important;
    height: 8px !important;
    width: 8px !important;
  }
`

const DEFAULT_ALLOWED_STATES = [IStatus_Enum.InProgress, IStatus_Enum.Live]

const DashboardIndex = () => {
  const { notification } = App.useApp()
  const company = useCompany()
  const { user } = useUser()

  const { response: dashboardsImages, loading: loadingDashboardImages } = useCallMavis<IDashboardImage[]>({
    method: 'GET',
    path: '/v1/narrative/index_with_image',
  })

  const { data: tagsResult, loading: tagsLoading } = useListCompanyTagsQuery({
    variables: { company_id: company?.id, user_id: user.id },
    fetchPolicy: 'cache-and-network',
  })
  const tags = tagsResult?.company_tags || []
  const sharedTags = getSharedCompanyTags(tags)

  // handle which overlay is shown
  const [overlay, setOverlay] = useState<OverlayProps | null>(null)

  const handleCloseOverlay = () => {
    setOverlay(null)
  }

  const handleOpenUpdateOverlay = (dashboard: DashboardType) => {
    setOverlay({ name: OverlayNames.OVERLAY_UPDATE, dashboard })
  }

  const handleOpenDeleteOverlay = (dashboard: DashboardType) => {
    setOverlay({ name: OverlayNames.OVERLAY_DELETE, dashboard })
  }

  const handleOpenConfigOverlay = (dashboard: DashboardType) => {
    setOverlay({ name: OverlayNames.OVERLAY_UPDATE_CONFIG, dashboard })
  }

  const handleOpenDuplicateOverlay = (dashboard: DashboardType) => {
    setOverlay({ name: OverlayNames.OVERLAY_DUPLICATE, dashboard })
  }

  const handleOpenSaveTemplateOverlay = () => {
    setOverlay({ name: OverlayNames.OVERLAY_TEMPLATE_SAVE })
  }

  // passed to save modal to keep track of refreshing (outside of dashboard count changes)
  const [refreshIndex, setRefreshIndex] = useState(false)

  // Get Dashboards
  const {
    data: dashboardsData,
    loading: dashboardsLoading,
    error: dashboardsError,
    refetch: refetchDashboards,
  } = useListDashboardsQuery({
    variables: { company_id: company.id, statuses: DEFAULT_ALLOWED_STATES, user_id: user.id },
    notifyOnNetworkStatusChange: true,
    // This makes sure data reloads every time
    // the page loads (solves create/delete inconsistencies)
    fetchPolicy: 'cache-and-network',
  })

  const allDashboards = dashboardsData?.narrative
  const prevDashboardsLoading = usePrevious(dashboardsLoading)
  const dashboardsDoneSuccessfullyLoading = useMemo(() => {
    return prevDashboardsLoading && !dashboardsLoading && !dashboardsError
  }, [prevDashboardsLoading, dashboardsLoading, dashboardsError])

  // handle get dashboards error
  useEffect(() => {
    if (dashboardsError) {
      notification.error({
        key: 'error-fetching-dashboards',
        message: 'Error Fetching Dashboards',
        description: dashboardsError.message,
      })
    }
  }, [dashboardsError, notification])

  // subscribe to the dashboards count (to refresh when changes)
  const { data: dashboardsUpdatedData } = useDashboardsUpdatedSubscription({
    variables: { company_id: company.id, statuses: DEFAULT_ALLOWED_STATES },
  })
  const dashboardsUpdated = dashboardsUpdatedData?.narrative
  const prevDashboardsUpdated = usePrevious(dashboardsUpdated)

  // refetch dashboards when dashboard count updates (add/delete)
  useEffect(() => {
    if (
      isFinite(prevDashboardsUpdated?.length) &&
      isFinite(dashboardsUpdated?.length) &&
      !isEqual(prevDashboardsUpdated?.length, dashboardsUpdated?.length)
    ) {
      refetchDashboards()
    }
  }, [refetchDashboards, prevDashboardsUpdated, dashboardsUpdated])

  // refetch dashboards when user updates a dashboard's config
  useEffect(() => {
    if (refreshIndex) {
      refetchDashboards()
      setRefreshIndex(false)
    }
  }, [refreshIndex, refetchDashboards])

  const recentlyViewedDashboards = useMemo(() => {
    // find all recently viewed boards
    const allRecentlyViewed = filter(allDashboards, (dashboard) => {
      return !isEmpty(filter(dashboard.tags, (tag) => tag.company_tag?.tag === RECENTLY_VIEWED))
    })

    // and sort them by when they were recently viewed
    return sortBy(
      allRecentlyViewed,
      (dashboard) => find(dashboard.tags, ['company_tag.tag', RECENTLY_VIEWED])?.updated_at
    ).reverse()
  }, [allDashboards])

  const favoritedDashboards = useMemo(() => {
    return filter(allDashboards, (dashboard) => {
      return !isEmpty(filter(dashboard.tags, (tag) => tag.company_tag?.tag === FAVORITES))
    })
  }, [allDashboards])

  const dashboardsByNonSharedTags = useMemo(() => {
    if (allDashboards) {
      return getDashboardsByNonSharedTags({ dashboards: allDashboards })
    }
  }, [allDashboards, getDashboardsByNonSharedTags])

  const privateDashboards = useMemo(() => {
    return filter(allDashboards, (dashboard) => dashboard?.state === IStatus_Enum.InProgress)
  }, [allDashboards])

  const noTagsSharedDashboards = filter(
    allDashboards,
    (dashboard) =>
      dashboard?.state === IStatus_Enum.Live &&
      isEmpty(filter(dashboard.tags, (tag) => !includes(NON_SHARED_TAGS, tag.company_tag?.tag)))
  )

  return (
    <Page title="Dashboards" breadcrumbs={[{ text: 'Dashboards' }]} style={{ height: '100vh', overflowY: 'hidden' }}>
      <DashboardIndexContext.Provider
        value={{
          tags,
          sharedTags,
          allDashboards,
          dashboardsImages,
          loadingDashboardImages,
          dashboardsDoneSuccessfullyLoading,
          handleOpenConfigOverlay,
          handleOpenDeleteOverlay,
          handleOpenDuplicateOverlay,
          handleOpenUpdateOverlay,
          handleCloseOverlay,
          handleOpenSaveTemplateOverlay,
          setRefreshIndex,
        }}
      >
        <LayoutContent
          siderWidth={0}
          style={{
            width: '100%',
            marginLeft: 0,
            height: '100%',
            overflowY: 'hidden',
            padding: '32px',
            paddingTop: '16px',
          }}
        >
          <TopBar />

          <Box
            style={{
              position: 'sticky',
              top: DASHBOARD_INDEX_TOP_BAR_HEIGHT,
              height: `calc(100vh - ${DASHBOARD_INDEX_TOP_BAR_HEIGHT}px)`,
              overflowY: 'auto',
              zIndex: DASHBOARD_CONTENT_Z_INDEX,
            }}
            pb="80px" // extra padding to escape Help Scout icon
          >
            <Spin spinning={dashboardsLoading || tagsLoading}>
              {isEmpty(allDashboards) && !dashboardsLoading && !dashboardsError && (
                <Flex style={{ height: '400px' }} justifyContent="center" alignItems="center">
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="It doesn't look like you have any dashboards yet."
                  />
                </Flex>
              )}

              {/* FAVORITED */}
              {!isEmpty(favoritedDashboards) && (
                <Box mt={3}>
                  <CardSection title="Favorites" dashboards={favoritedDashboards} icon={<HeartOutlined />} />
                </Box>
              )}

              {/* RECENTLY VIEWED */}
              {!isEmpty(recentlyViewedDashboards) && (
                <Box mt={3}>
                  <CardSection
                    title="Recently Viewed"
                    dashboards={recentlyViewedDashboards}
                    icon={<ClockCircleOutlined />}
                  />
                </Box>
              )}

              {/* NON-SHARED TAG DASHBOARDS */}
              {!isEmpty(dashboardsByNonSharedTags) &&
                map(keys(dashboardsByNonSharedTags), (tagName) => {
                  const tagColor = find(dashboardsByNonSharedTags[tagName]?.[0]?.tags, ['company_tag.tag', tagName])
                    ?.company_tag?.color

                  return (
                    <Box mt={3} key={tagName}>
                      <CardSection
                        title={startCase(tagName)}
                        dashboards={dashboardsByNonSharedTags[tagName]}
                        icon={
                          <StyledBadgeContainer>
                            <Badge color={tagColor || 'transparent'} />
                          </StyledBadgeContainer>
                        }
                      />
                    </Box>
                  )
                })}

              {/* SHARED - No Tags */}
              {!isEmpty(noTagsSharedDashboards) && (
                <Box mt={3}>
                  <CardSection title="Shared - No Tags" dashboards={noTagsSharedDashboards} icon={<TeamOutlined />} />
                </Box>
              )}

              {/* PRIVATE  */}
              {!isEmpty(privateDashboards) && (
                <Box mt={3}>
                  <CardSection title="Private" dashboards={privateDashboards} icon={<UserOutlined />} />
                </Box>
              )}
            </Spin>
          </Box>
        </LayoutContent>

        {/* OVERLAYS */}
        <DashboardModals overlay={overlay} />
      </DashboardIndexContext.Provider>
    </Page>
  )
}

export default DashboardIndex
