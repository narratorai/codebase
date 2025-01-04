import { Alert, App, Checkbox, Collapse, Spin } from 'antd-next'
import { Divider } from 'components/antd/staged'
import { useCompany } from 'components/context/company/hooks'
import ExploreDatasetModal from 'components/Datasets/Explore/ExploreDatasetModal'
import { Box, Flex, Typography } from 'components/shared/jawns'
import MarkdownRenderer from 'components/shared/MarkdownRenderer'
import Page from 'components/shared/Page'
import {
  IListDimTablesSubscription,
  useActivityIndexNeedsUpdatingSubscription,
  useActivityIndexV2Query,
  useListDimTablesSubscription,
} from 'graph/generated'
import { each, filter, includes, isEmpty, isEqual, keys, map, orderBy, startCase } from 'lodash'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { RouteChildrenProps, useHistory } from 'react-router'
import styled from 'styled-components'
import { MavisDocumentationResponse } from 'util/mavis_documentation/interfaces'
import Route from 'util/route'
import useCallMavis from 'util/useCallMavis'
import usePrevious from 'util/usePrevious'

import ActivityCard from './ActivityCard'
import ActivityIndexSearch from './ActivityIndexSearch'
import ActivityStreamHeader from './ActivityStreamHeader'
import CategoryHeader from './CategoryHeader'
import {
  ACTIVITY_STREAM_EDIT_PARAM,
  DIM_TABLE_EDIT_PARAM,
  NO_ACTIVITY_STREAM_TEXT,
  NO_CATEGORY_TEXT,
} from './constants'
import DimTableCard from './DimTableCard'
import EditActivity from './EditActivity'
import EditActivityStream from './EditActivityStream'
import EditDimTable from './EditDimTable'
import ExitEditButton from './ExitEditButton'
import { Activities } from './interfaces'

export type DimTables = IListDimTablesSubscription['dim_table']

const HEADER_HEIGHT = 80
// give header stacking context precident
// to help dropdown menus cover content below
const HEADER_Z_INDEX = 2
const CONTENT_Z_INDEX = 1

// make > / v icon and header text aligned
const StyledCollapse = styled(Collapse)`
  .antd5-collapse-header {
    align-items: center !important;
  }

  .antd5-collapse-content-box {
    padding: 0;
  }
`

interface SortedActivities {
  // activity stream
  [key: string]: {
    // category: composed of activities
    [key: string]: Activities
  }
}

const makeSortedActivities = (activities?: Activities): SortedActivities => {
  const activitiesByStreamAndCategory: SortedActivities = {}

  // sort activities by stream, then by category
  each(activities, (act) => {
    const activityStream = act?.company_table?.activity_stream || NO_ACTIVITY_STREAM_TEXT

    // add default value for stream if it didn't already exist
    if (!activitiesByStreamAndCategory[activityStream]) {
      activitiesByStreamAndCategory[activityStream] = {}
    }

    // check if the category has been added to that stream
    const category = act.company_category?.category || NO_CATEGORY_TEXT

    // add default value for stream.category if it didn't already exist
    if (!activitiesByStreamAndCategory[activityStream][category]) {
      activitiesByStreamAndCategory[activityStream][category] = []
    }

    // add the activity to stream.category
    activitiesByStreamAndCategory[activityStream][category].push(act)
  })

  // now that the activities are sorted by stream and category
  // sort the activities within a category, by the amount of datasets they have
  each(keys(activitiesByStreamAndCategory), (activityStream) => {
    each(keys(activitiesByStreamAndCategory[activityStream]), (category) => {
      const activitiesInStreamAndCategory = activitiesByStreamAndCategory[activityStream][category]
      const sortedActivitiesInStreamAndCategory = orderBy(
        activitiesInStreamAndCategory,
        (act) => {
          return act.datasets?.length
        },
        ['desc']
      )

      activitiesByStreamAndCategory[activityStream][category] = sortedActivitiesInStreamAndCategory
    })
  })

  return activitiesByStreamAndCategory
}

// a one time map of {activity_stream: table_id}[] and the inverse
// {table_id: activity_stream}[]
// helps lookup table id when mapping over showableSortedActivities
// and get stream name from id in drawer
const makeActivityStreamsDict = (activities?: Activities): { [key: string]: string } => {
  const activitiesDict: { [key: string]: string } = {}

  each(activities, (act) => {
    if (act?.company_table?.activity_stream) {
      activitiesDict[act.company_table.activity_stream] = act.company_table.id
    }

    if (act?.company_table?.id) {
      activitiesDict[act.company_table.id] = act.company_table.activity_stream
    }
  })

  return activitiesDict
}

const ActivityIndexV2 = ({ match }: RouteChildrenProps) => {
  const company = useCompany()
  const history = useHistory()
  const { notification } = App.useApp()

  const isEditMode = includes(history.location.pathname, '/edit')

  const { response: docsResponse, loading: loadingDocs } = useCallMavis<MavisDocumentationResponse>({
    method: 'GET',
    path: '/v1/docs',
    params: { slugs: 'activities/landing_page' },
  })
  const markdown = docsResponse?.all_documents?.[0]?.markdown

  const {
    data: activitiesData,
    refetch: refetchActvities,
    loading: activitiesLoading,
    error: errorFetchingActivities,
  } = useActivityIndexV2Query({
    variables: { company_slug: company.slug },
  })

  // use this small subscription to determine whether we need to refetch the actvities
  const { data: activitiesNeedsUpdating } = useActivityIndexNeedsUpdatingSubscription({
    variables: { company_slug: company.slug },
  })
  const lastActivityUpdatedAt = activitiesNeedsUpdating?.all_activities?.[0]?.updated_at
  const prevLastActivityUpdatedAt = usePrevious(lastActivityUpdatedAt)

  // refetch the activities when they are updated
  useEffect(() => {
    if (prevLastActivityUpdatedAt && !isEqual(prevLastActivityUpdatedAt, lastActivityUpdatedAt)) {
      refetchActvities()
    }
  }, [prevLastActivityUpdatedAt, lastActivityUpdatedAt, refetchActvities])

  const {
    data: dimTableData,
    loading: dimTablesLoading,
    error: errorFetchingDimTables,
  } = useListDimTablesSubscription({
    variables: { company_id: company.id },
  })

  const dimTables = dimTableData?.dim_table
  const prevDimTables = usePrevious(dimTables)
  const [showableDimTables, setShowableDimTables] = useState<DimTables | undefined>(dimTables)

  // set initial dim tables on load
  useEffect(() => {
    if (!prevDimTables && dimTables) {
      setShowableDimTables(dimTables)
    }
  }, [prevDimTables, dimTables])

  const dimTablesUnderMaintenance = useMemo(() => {
    return filter(dimTables, (dim) => !isEmpty(dim.maintenances))
  }, [dimTables])

  const [shownDimensionKeys, setShownDimensionKeys] = useState<string[]>(['table'])

  const allActivities = useMemo(() => {
    return activitiesData?.all_activities
  }, [activitiesData?.all_activities])
  const prevAllActivties = usePrevious(allActivities)

  const activitiesUnderMaintenance = useMemo(() => {
    return filter(allActivities, (act) => !isEmpty(act.activity_maintenances))
  }, [allActivities])

  const activityStreamDict = useMemo(() => {
    return makeActivityStreamsDict(allActivities)
  }, [allActivities])

  const [showableActivities, setShowableActivities] = useState<Activities>()

  const showableSortedActivities = useMemo<SortedActivities>(() => {
    return makeSortedActivities(showableActivities)
  }, [showableActivities])

  const activityStreamKeys = keys(showableSortedActivities)
  const prevActivityStreamKeys = usePrevious(activityStreamKeys)

  // count all activities by stream
  const streamCounts = useMemo(() => {
    const streamByCount: Record<string, number> = {}

    each(allActivities, (act) => {
      const activityStream = act?.company_table?.activity_stream || NO_ACTIVITY_STREAM_TEXT

      if (!streamByCount[activityStream]) {
        streamByCount[activityStream] = 0
      }

      streamByCount[activityStream] = streamByCount[activityStream] + 1
    })

    return streamByCount
  }, [allActivities])

  const [shownActivityKeys, setShownActivityKeys] = useState<string[]>(activityStreamKeys)

  // set showable activties to all on load
  useEffect(() => {
    if (isEmpty(prevAllActivties) && !isEmpty(allActivities)) {
      setShowableActivities(allActivities)
    }
  }, [prevAllActivties, allActivities])

  // update shownActivityKeys to all - once we have results (default show all activity streams)
  useEffect(() => {
    if (isEmpty(prevActivityStreamKeys) && !isEmpty(activityStreamKeys)) {
      setShownActivityKeys(activityStreamKeys)
    }
  }, [prevActivityStreamKeys, activityStreamKeys])

  // handle fetching activities error
  useEffect(() => {
    if (errorFetchingActivities) {
      notification.error({
        key: 'error-fetching-activities',
        placement: 'topRight',
        message: 'Error Fetching Activities',
        description: errorFetchingActivities?.message,
      })
    }
  }, [errorFetchingActivities, notification])

  // handle fetching dimension tables error
  useEffect(() => {
    if (errorFetchingDimTables) {
      notification.error({
        key: 'error-fetching-dim-tables',
        placement: 'topRight',
        message: 'Error Fetching Dimension Tables',
        description: errorFetchingDimTables?.message,
      })
    }
  }, [errorFetchingDimTables, notification])

  const [onlyShowMaintenance, setOnlyShowMaintenance] = useState(false)
  const toggleShowOnlyMaintenance = useCallback(() => {
    // (was only show maintenance - so now show everything)
    if (onlyShowMaintenance) {
      setShowableActivities(allActivities)
      setShowableDimTables(dimTables)
    }

    // (was show everything - so now show only maintenance)
    if (!onlyShowMaintenance) {
      setShowableActivities(activitiesUnderMaintenance)
      setShowableDimTables(dimTablesUnderMaintenance)
    }

    // toggle whether showing only maintenance or not
    setOnlyShowMaintenance((prevValue) => !prevValue)
  }, [allActivities, activitiesUnderMaintenance, dimTables, dimTablesUnderMaintenance, onlyShowMaintenance])

  return (
    <Page
      title="Activities | Narrator"
      breadcrumbs={[{ text: 'Activities' }]}
      bg="white"
      hasSider={false}
      style={{ height: '100vh', overflowY: 'hidden' }}
    >
      <Box px={4} pt={2}>
        {/* Header */}
        <Flex
          pb={2}
          alignItems="center"
          justifyContent="space-between"
          style={{ position: 'sticky', top: 0, height: HEADER_HEIGHT, zIndex: HEADER_Z_INDEX }}
        >
          <Flex alignItems="center">
            <Typography type="title300" mr={4}>
              Activities
            </Typography>

            <ActivityIndexSearch
              setShowableActivities={setShowableActivities}
              activities={allActivities}
              dimTables={dimTables}
            />
          </Flex>
        </Flex>

        {/* Main Content (below header) */}
        <Flex
          justifyContent="space-between"
          style={{
            position: 'sticky',
            top: HEADER_HEIGHT,
            height: `calc(100vh - ${HEADER_HEIGHT}px)`,
            zIndex: CONTENT_Z_INDEX,
          }}
        >
          {/* Left side content */}
          <Box width="40%" pb={3} style={{ height: '100%', overflowY: 'auto' }}>
            {/* under maintenance filter */}
            {(!isEmpty(activitiesUnderMaintenance) || !isEmpty(dimTablesUnderMaintenance)) && (
              <Box mb={2}>
                <Alert
                  type="warning"
                  message={
                    <Box>
                      <Typography>{`There are ${
                        (activitiesUnderMaintenance.length || 0) + (dimTablesUnderMaintenance.length || 0)
                      } activities under maintenance`}</Typography>

                      <Checkbox checked={onlyShowMaintenance} onClick={toggleShowOnlyMaintenance}>
                        Only show maintenance
                      </Checkbox>
                    </Box>
                  }
                />
              </Box>
            )}

            <Spin spinning={activitiesLoading}>
              <StyledCollapse
                activeKey={shownActivityKeys}
                onChange={(values) => {
                  setShownActivityKeys(values as string[])
                }}
                ghost
              >
                {map(activityStreamKeys, (streamKey) => (
                  // activity stream
                  <Collapse.Panel
                    key={streamKey}
                    header={
                      <ActivityStreamHeader
                        streamName={streamKey}
                        tableId={activityStreamDict[streamKey]}
                        activitiesCount={streamCounts[streamKey]}
                      />
                    }
                  >
                    {/* Category */}
                    <Box ml={3}>
                      {map(keys(showableSortedActivities[streamKey]), (categoryKey) => (
                        <Box key={categoryKey}>
                          <CategoryHeader
                            color={
                              showableSortedActivities[streamKey][categoryKey][0].company_category?.color || undefined
                            }
                            name={startCase(categoryKey)}
                            activityCount={showableSortedActivities[streamKey][categoryKey]?.length || 0}
                          />

                          {/* Activities */}
                          <Box ml={2} mb={4}>
                            {map(showableSortedActivities[streamKey][categoryKey], (activity) => (
                              <ActivityCard key={activity.id} activity={activity} />
                            ))}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Collapse.Panel>
                ))}
              </StyledCollapse>
            </Spin>

            <Spin spinning={dimTablesLoading}>
              {!isEmpty(dimTables) && (
                <StyledCollapse
                  activeKey={shownDimensionKeys}
                  ghost
                  onChange={(values) => {
                    setShownDimensionKeys(values as string[])
                  }}
                >
                  <Collapse.Panel
                    key="table"
                    header={
                      <Typography type="title300" fontWeight={300}>
                        Dimension Tables ({dimTables?.length})
                      </Typography>
                    }
                  >
                    <Box ml={5}>
                      {map(showableDimTables, (dimTable) => (
                        <DimTableCard dimTable={dimTable} />
                      ))}
                    </Box>
                  </Collapse.Panel>
                </StyledCollapse>
              )}
            </Spin>
          </Box>

          <Box px={2}>
            <Divider type="vertical" style={{ height: '100%' }} />
          </Box>

          {/* Right side content */}
          <Box width="60%" pr={2} pb={2} style={{ height: '100%', overflow: 'auto' }}>
            {isEditMode && (
              <Flex justifyContent="flex-end">
                <ExitEditButton />
              </Flex>
            )}

            {!isEditMode && <Spin spinning={loadingDocs}>{markdown && <MarkdownRenderer source={markdown} />}</Spin>}

            {/* NOTE: Routes below include /edit in their pathname
              // all are: isEditMode 
            */}

            {/* Edit Activity Stream Drawer */}
            <Route
              path={`${match?.path}/${ACTIVITY_STREAM_EDIT_PARAM}/:id`}
              render={(props) => <EditActivityStream {...props} />}
            />

            {/* Edit Activity Drawer */}
            <Route path={`${match?.path}/edit/:id/:tab?`} render={(props) => <EditActivity {...props} />} />

            {/* Edit Dim Table Drawer */}
            <Route
              path={`${match?.path}/${DIM_TABLE_EDIT_PARAM}/:id`}
              render={(props) => <EditDimTable allDimTables={dimTables} {...props} />}
            />
          </Box>
        </Flex>

        {/* Explore Activity Modal */}
        <Route
          path={`${match?.path}/explorer/:datasetSlug/:linkSlug?`}
          render={(props) => <ExploreDatasetModal {...props} />}
        />
      </Box>
    </Page>
  )
}

export default ActivityIndexV2
