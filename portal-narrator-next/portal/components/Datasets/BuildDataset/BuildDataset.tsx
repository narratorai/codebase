import { DeleteOutlined } from '@ant-design/icons'
import { useMachine } from '@xstate/react'
import { App, Button, Result, Spin, Switch, Tooltip } from 'antd-next'
import { useAuth0 } from 'components/context/auth/hooks'
import { useCompany, useCompanyRefetch } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import CustomerDrawer from 'components/CustomerJourney/v2/CustomerDrawer'
import { RECENTLY_VIEWED } from 'components/shared/IndexPages/constants'
import useEnsureCompanyTagForUser from 'components/shared/IndexPages/useEnsureCompanyTagForUser'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { FixedSider, LayoutContent, LayoutContentProps } from 'components/shared/layout/LayoutWithFixedSider'
import Page from 'components/shared/Page'
import {
  GetDatasetBySlugDocument,
  IActivity,
  ITag_Relations_Enum,
  useCreateTagMutation,
  useDatasetConfigUpdatedSubscription,
  useListActivitiesLazyQuery,
  useListCompanyTagsQuery,
} from 'graph/generated'
import { cloneDeep, find, forEach, get, isEmpty, isEqual, isFunction, map, truncate } from 'lodash'
import { buildDatasetMachine, machineServices, makeQueryDefinitionFromContext } from 'machines/datasets'
import queryString from 'query-string'
import React, { lazy, Suspense, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import Measure from 'react-measure'
import { RouteComponentProps } from 'react-router'
import styled from 'styled-components'
import analytics from 'util/analytics'
import { colors } from 'util/constants'
import { INFO_PANEL_CONTAINER_ID, RAW_DATASET_KEY, RUN_DATASET_OVERRIDE_ALL } from 'util/datasets'
import { cancelAllDatasetApiRequests, fetchRunDataset, fetchRunDatasetCount } from 'util/datasets/api'
import { GLOBAL_CTA_HEIGHT } from 'util/datasets/constants'
import {
  DatasetMachineState,
  IDatasetQueryDefinition,
  IDatasetReducerState,
  viewTypeConstants,
} from 'util/datasets/interfaces'
import { reportError } from 'util/errors'
import { useImperativeQuery, userDisplayName } from 'util/helpers'
import usePrevious from 'util/usePrevious'

import { isProduction } from '@/util/env'
import { getLogger } from '@/util/logger'

import AutoRun from './AutoRun'
import DatasetErrorBoundary from './DatasetErrorBoundary'
import DatasetFormContext from './DatasetFormContext'
import DatasetNotifications from './DatasetNotifications'
import datasetReducer, {
  ACTION_TYPE_COUNT,
  ACTION_TYPE_QUERY,
  INITIAL_API_RESPONSE_OBJECT,
  initialState,
  RUN_DATASET_COUNT_CANCEL_REQUEST,
  RUN_DATASET_COUNT_FAILURE,
  RUN_DATASET_COUNT_REQUEST,
  RUN_DATASET_COUNT_SUCCESS,
  RUN_DATASET_QUERY_CANCEL_REQUEST,
  RUN_DATASET_QUERY_FAILURE,
  RUN_DATASET_QUERY_REQUEST,
  RUN_DATASET_QUERY_SUCCESS,
} from './datasetReducer'
import DatasetTabCTA from './DatasetTabCTA'
import DatasetTable from './DatasetTable/DatasetTable'
import GridContextMenu from './DatasetTable/GridContextMenu'
import QueryLoadingTimer from './DatasetTable/QueryLoadingTimer'
import { DirtyFormChecker, StaleFormChecker } from './DirtyStaleChecker'
import DuplicateParentMarkdown from './DuplicateParentMarkdown'
import FromNarrativeBanner from './FromNarrativeBanner'
import GlobalCTA from './GlobalCTA'
import GroupColumns from './InfoPanel/GroupColumns'
import ParentColumns from './InfoPanel/ParentColumns'
import Plotter from './Plotter/Plotter'
import PreventBackListener from './PreventBackListener'
import QueryParamUpdater from './QueryParamUpdater'
import QuickSaveListener from './QuickSaveListener'
import SQLView from './SQLView'
import TabHeaders from './TabHeaders/TabHeaders'
import DatasetDefinition, { DRAWER_HEIGHT } from './tools/DatasetDefinition/DatasetDefinition'
import Reconciler from './tools/Reconciler/Reconciler'
import ToolModal from './tools/ToolModal'

const DatasetJsonModal = lazy(() => import(/* webpackChunkName: "dataset-json" */ './DatasetJsonModal'))

const SHOW_NARRATIVE_BANNER_OFFSET = 24

const logger = getLogger()

const PageWrapper = styled.div`
  flex-grow: 1;
  display: flex;

  .antd5-spin-nested-loading {
    flex-grow: 1;
  }
`

const StyledLayoutContent = styled(LayoutContent).withConfig<
  LayoutContentProps & { drawerVisible?: boolean; bg?: string; showFromNarrativeBanner?: boolean }
>({
  shouldForwardProp: (prop) => !['drawerVisible', 'showFromNarrativeBanner'].includes(prop as string),
})`
  display: flex;
  flex-direction: column;

  /* Needed for Drawer to show up properly: */
  position: relative;
  overflow: hidden;

  /* Some overrides to make it look right with the tabs  */
  padding: 0 !important;
  padding-top: ${({ showFromNarrativeBanner }) =>
    showFromNarrativeBanner ? `${SHOW_NARRATIVE_BANNER_OFFSET + 24}px` : '24px'} !important;
  box-shadow: rgb(0 0 0 / 10%) -5px 30px 15px -9px !important;
`

const StyledSiderFlex = styled(Flex).withConfig<{
  drawerVisible: boolean
  heightAdjust?: number
  showFromNarrativeBanner?: boolean
}>({
  shouldForwardProp: (prop) => !['drawerVisible', 'heightAdjust', 'flexDirection'].includes(prop),
})`
  /* matching values from https://github.com/ant-design/ant-design/blob/master/components/style/themes/default.less#L118 */

  /* which are used in antd Drawer (https://github.com/ant-design/ant-design/blob/master/components/drawer/style/drawer.less) */
  transition: transform 0.3s cubic-bezier(0.7, 0.3, 0.1, 1);
  transform: translate3d(0, ${({ drawerVisible, heightAdjust }) => (drawerVisible ? `-${heightAdjust}px` : 0)}, 0);
  height: calc(100vh - ${GLOBAL_CTA_HEIGHT}px);
  height: ${({ drawerVisible, heightAdjust, showFromNarrativeBanner }) =>
    drawerVisible
      ? `calc(100vh - ${
          GLOBAL_CTA_HEIGHT + (showFromNarrativeBanner ? SHOW_NARRATIVE_BANNER_OFFSET : 0) - (heightAdjust || 0)
        }px) `
      : `calc(100vh - ${GLOBAL_CTA_HEIGHT + (showFromNarrativeBanner ? SHOW_NARRATIVE_BANNER_OFFSET : 0)}px) `};
`

const StyledContentFlex = styled(Flex).withConfig<{ drawerVisible: boolean }>({
  shouldForwardProp: (prop) => !['drawerVisible'].includes(prop),
})`
  flex-grow: 1;
  min-height: 0;

  /* match tab border color */
  border-left: 1px solid #f0f0f0;

  /* matching values from https://github.com/ant-design/ant-design/blob/master/components/style/themes/default.less#L118 */

  /* which are used in antd Drawer (https://github.com/ant-design/ant-design/blob/master/components/drawer/style/drawer.less) */
  transition: transform 0.3s cubic-bezier(0.7, 0.3, 0.1, 1);
  transform: translate3d(0, ${({ drawerVisible }) => (drawerVisible ? `${DRAWER_HEIGHT}` : 0)}, 0);
  opacity: ${({ drawerVisible }) => (drawerVisible ? 0.5 : 1)};
  pointer-events: ${({ drawerVisible }) => (drawerVisible ? 'none' : 'initial')};
`

const StyledBox = styled(Box)`
  position: relative;
  min-width: 0;
  transition: opacity 0.15s ease-in;
`

type BuildDatasetProps = RouteComponentProps<{ dataset_slug?: string }>

const BuildDataset: React.FC<BuildDatasetProps> = ({ location: { search }, match }) => {
  const company = useCompany()
  const { user } = useUser()
  const refetchCompanySeed = useCompanyRefetch()
  const { tables } = company
  const { getTokenSilently } = useAuth0()
  const { notification } = App.useApp()

  const dataset_slug = match?.params?.dataset_slug

  const { data: tagsResult } = useListCompanyTagsQuery({
    variables: { company_id: company?.id, user_id: user.id },
    fetchPolicy: 'cache-and-network',
  })
  const tags = useMemo(() => tagsResult?.company_tags || [], [tagsResult?.company_tags])

  const [createResourceTag] = useCreateTagMutation()
  const getDatasetGraph = useImperativeQuery(GetDatasetBySlugDocument)

  const machine = useMemo(
    () =>
      buildDatasetMachine.withConfig({
        services: machineServices({
          company,
          user,
          getToken: getTokenSilently,
          getDatasetGraph,
        }),
      }),
    [company, user, getDatasetGraph, getTokenSilently]
  )

  const [machineCurrent, machineSend] = useMachine(machine, {
    devTools: !isProduction,
  })

  const dataset = machineCurrent?.context?._dataset_from_graph

  const machineMainIsIdle = machineCurrent.matches({ main: 'idle' })
  const machineMainIsLoading = machineCurrent.matches({ main: 'loading' })
  const machineMainIsProcessing = machineCurrent.matches({ main: 'processing' })
  const machineMainHasError = machineCurrent.matches({ main: 'error' })
  const view = machineCurrent.context._view
  const machineQueryDefinition: IDatasetQueryDefinition = makeQueryDefinitionFromContext(machineCurrent.context)
  const showFromNarrativeBanner = !!machineCurrent.context._from_narrative?.open

  const editingDefinition = machineCurrent.matches({ edit: 'definition' })
  const prevEditingDefinition = usePrevious(editingDefinition)
  const {
    _definition_context: definitionContext,
    _error: machineError,
    _is_parent_duplicate: isDuplicateParentGroup,
  } = machineCurrent.context

  const [hasSetRecentlyViewed, setHasSetRecentlyViewed] = useState(false)
  const [showJson, setShowJson] = useState(false)
  const [jsonValue, setJsonValue] = useState<string | null>(null)
  const [obscureSensitiveInfo, setObscureSensitiveInfo] = useState(false)

  // Because all_groups is an array, we need to know the selected group index
  // to be able to access it with <Field> subscriptions in child components
  const { _group_slug: groupSlug } = machineCurrent.context
  const prevGroupSlug = usePrevious(groupSlug)

  const [groupIndex, setGroupIndex] = useState(null)

  // If Overlay type is set, that overlay is open!
  // Also allows for additional props to be passed into overlays
  const [toolOverlay, setToolOverlay] = useState<string | null>(null)
  const [toolOverlayProps, setToolOverlayProps] = useState({})

  // Set controller to ref instead of state so it doesn't trigger re-renders
  const controllerRef = useRef(new AbortController())

  // Set isSubscribed to capture whether we can continue to update state inside the
  // runDataset async functions that update the datasetReducer.
  // See the useEffect cleanup function below that sets this to false on unmount
  const isSubscribedToRunningQueries = useRef(true)

  const [runDatasetParams, setRunDatasetParams] = useState<{
    queryDefinition: IDatasetQueryDefinition
    runGroupSlug: string | null
    runOptions: any
    datasetApiStates: IDatasetReducerState
    runOverride?: string
  }>()

  const deleteColumnsMode = find(machineCurrent?.context?._delete_columns_tabs, [
    'tabName',
    groupSlug ? groupSlug : RAW_DATASET_KEY,
  ])

  // The row right clicked on - used to open Customer Journey as sidebar
  const [customerJourneyRow, setCustomerJourneyRow] = useState()
  const [customerJourneyOptions, setCustomerJourneyOptions] = useState<{ fullJourney?: boolean }>()
  const selectCustomerJourney = useCallback(
    (customerJourney: any, options = {}) => {
      setCustomerJourneyRow(customerJourney)
      setCustomerJourneyOptions(options)

      analytics.track('opened_dataset_customer_journey', {
        dataset_slug: dataset_slug,
        group_slug: groupSlug,
      })
    },
    [setCustomerJourneyRow, groupSlug, dataset_slug]
  )

  const [ensureCompanyTagForUser] = useEnsureCompanyTagForUser()

  // Subscribe to updated config
  // to potentially notify the user if someone else updates this dataset
  const { data: configUpdatedData } = useDatasetConfigUpdatedSubscription({
    variables: {
      company_id: company.id,
      dataset_id: dataset?.id,
    },
    skip: !dataset?.id,
  })

  const datasetConfigUpdated = configUpdatedData?.dataset[0]
  const prevDatasetConfigUpdated = usePrevious(datasetConfigUpdated)

  // Notify user if the config has been updated by another user
  useEffect(() => {
    if (
      prevDatasetConfigUpdated?.last_config_updated_at &&
      datasetConfigUpdated?.last_config_updated_at &&
      !isEqual(prevDatasetConfigUpdated?.last_config_updated_at, datasetConfigUpdated?.last_config_updated_at) &&
      !isEqual(datasetConfigUpdated?.updated_by, user.id)
    ) {
      const updatedCompanyUser = datasetConfigUpdated.updated_by_user?.company_users?.[0]
      const updatedUserEmail = datasetConfigUpdated.updated_by_user?.email
      const userName = userDisplayName(updatedCompanyUser?.first_name, updatedCompanyUser?.last_name, updatedUserEmail)

      notification.info({
        key: 'last_config_updated_at_key',
        message: (
          <Typography>
            This dataset has been updated by <span style={{ fontWeight: 'bold' }}>{userName}</span>.
          </Typography>
        ),
        description: (
          <Typography>
            <Button style={{ padding: 0 }} type="link" onClick={() => window.location.reload()}>
              Click here
            </Button>{' '}
            to refresh and see the latest changes
          </Typography>
        ),
        placement: 'topRight',
        duration: null,
      })
    }
  }, [prevDatasetConfigUpdated, datasetConfigUpdated, user])

  // Reducer for Query and Metrics responses
  // TODO: we should move this reducer logic to the machine
  // https://app.shortcut.com/narrator/story/3819/remove-dataset-reducer-logic-to-machine
  const [datasetApiStates, apiStateDispatch] = useReducer(datasetReducer, initialState)
  const selectedApiData = get(datasetApiStates, groupSlug || RAW_DATASET_KEY, INITIAL_API_RESPONSE_OBJECT)
  const prevColumnMapping = usePrevious(selectedApiData?.column_mapping)

  // update columns_order every time the column mapping changes
  // this ensures that newly generated columns (not cohort/append)
  // are accounted for in the order
  // (don't override if changing from one group to another - don't want to loose unsaved changes)
  // TODO: remove this effect when we implement https://app.shortcut.com/narrator/story/3819/remove-dataset-reducer-logic-to-machine
  useEffect(() => {
    if (
      selectedApiData?.column_mapping &&
      !isEqual(prevColumnMapping, selectedApiData?.column_mapping) &&
      isEqual(prevGroupSlug, groupSlug)
    ) {
      const colIds = map(selectedApiData?.column_mapping, (col) => col.id)
      machineSend('SET_COLUMNS_ORDER_OVERRIDE', { groupSlug, colIds })
    }
  }, [machineSend, prevColumnMapping, selectedApiData?.column_mapping, prevGroupSlug, groupSlug])

  const runningAllTabs = get(runDatasetParams, 'runOverride') === RUN_DATASET_OVERRIDE_ALL

  const activityStream = machineCurrent.context.activity_stream

  const [doActivitiesQuery, { data: activitiesData, loading: activitiesLoading, refetch: refreshGraphActivities }] =
    useListActivitiesLazyQuery({ fetchPolicy: 'cache-and-network' })

  const streamActivities = (activitiesData?.all_activities || []) as IActivity[]

  const handleCloseToolOverlay = () => {
    setToolOverlay(null)
    setToolOverlayProps({})
  }

  const handleOpenToolOverlay = ({ toolType, toolOverlayProps = {} }: { toolType: string; toolOverlayProps?: any }) => {
    setToolOverlay(toolType)
    setToolOverlayProps(toolOverlayProps)
  }

  const handleOpenIntegrationOverlay = useCallback(() => {
    machineSend('EDIT_INTEGRATIONS')
  }, [machineSend])

  const handleToggleShowJson = () => {
    if (!showJson) {
      setJsonValue(JSON.stringify(machineQueryDefinition, null, 2))
      return setShowJson(true)
    }

    setShowJson(false)
  }

  const handleToggleSensitiveInfo = () => setObscureSensitiveInfo(!obscureSensitiveInfo)

  // When running all tabs
  const handleCancelAllState = ({ queryDefinition }: { queryDefinition: IDatasetQueryDefinition }) => {
    // update parent dataset if it hasn't completed
    const isRawDatasetLoading = get(datasetApiStates, `${RAW_DATASET_KEY}.${ACTION_TYPE_QUERY}.loading`)
    const isRawCountLoading = get(datasetApiStates, `${RAW_DATASET_KEY}.${ACTION_TYPE_COUNT}.loading`)

    if (isRawDatasetLoading) {
      apiStateDispatch({ type: RUN_DATASET_QUERY_CANCEL_REQUEST, slug: dataset_slug })
    }
    if (isRawCountLoading) {
      apiStateDispatch({ type: RUN_DATASET_COUNT_CANCEL_REQUEST, slug: dataset_slug })
    }

    // update all group datasets if they haven't completed
    const groups = get(queryDefinition, 'query.all_groups', [])
    forEach(groups, (group) => {
      const isGroupDatasetLoading = get(datasetApiStates, `${group.slug}.${ACTION_TYPE_QUERY}.loading`)
      const isGroupCountLoading = get(datasetApiStates, `${group.slug}.${ACTION_TYPE_COUNT}.loading`)

      if (isGroupDatasetLoading) {
        apiStateDispatch({ type: RUN_DATASET_QUERY_CANCEL_REQUEST, slug: dataset_slug, groupSlug: group.slug })
      }
      if (isGroupCountLoading) {
        apiStateDispatch({ type: RUN_DATASET_COUNT_CANCEL_REQUEST, slug: dataset_slug, groupSlug: group.slug })
      }
    })
  }

  const cancelRunDataset = async () => {
    // TODO: should we set canceled state to machine here?

    // Use queryDefinition from store to guarantee same query is being canceled
    const queryDefinition = selectedApiData[ACTION_TYPE_QUERY].queryDefinition

    // if they were 'running all tabs', make sure to stop the counter for parent and all groups on cancel
    if (runningAllTabs) {
      handleCancelAllState({ queryDefinition })
    } else {
      // they were just running a single tab, so just stop the ticker for that tab
      apiStateDispatch({ type: RUN_DATASET_QUERY_CANCEL_REQUEST, slug: dataset_slug, groupSlug })
    }

    controllerRef.current.abort()
    controllerRef.current = new AbortController()

    try {
      await cancelAllDatasetApiRequests({
        getToken: getTokenSilently,
        company,
        groupSlug,
        selectedApiData,
        runningAllTabs,
      })

      analytics.track('canceled_dataset', {
        dataset_slug: dataset_slug,
        group_slug: groupSlug,
      })
    } catch (err) {
      // Do nothing if cancellation fails
      logger.error({ err }, 'Cancel error')
    }
  }

  const cancelRunCount = async () => {
    // Use queryDefinition from store to guarantee same query is being canceled
    const queryDefinition = selectedApiData[ACTION_TYPE_COUNT].queryDefinition

    // if they were 'running all tabs', make sure to stop the counter for parent and all groups on cancel
    if (runningAllTabs) {
      handleCancelAllState({ queryDefinition })
    } else {
      // they were just running a single tab, so just stop the ticker for that tab
      apiStateDispatch({ type: RUN_DATASET_COUNT_CANCEL_REQUEST, slug: dataset_slug, groupSlug })
    }

    controllerRef.current.abort()
    controllerRef.current = new AbortController()

    try {
      await cancelAllDatasetApiRequests({
        getToken: getTokenSilently,
        company,
        groupSlug,
        selectedApiData,
        runningAllTabs,
      })
    } catch (err) {
      // Do nothing if cancellation fails
      logger.error({ err }, 'Cancel error')
    }
  }

  const handleRunDataset = (runOptions = {}) => {
    setRunDatasetParams({
      queryDefinition: machineQueryDefinition,
      runGroupSlug: groupSlug,
      runOptions,
      datasetApiStates,
    })
  }

  // Loop through all group tabs and run all of them!
  const handleRunAllTabs = (runOptions = {}) => {
    setRunDatasetParams({
      queryDefinition: machineQueryDefinition,
      runGroupSlug: null,
      runOptions,
      runOverride: RUN_DATASET_OVERRIDE_ALL,
      datasetApiStates,
    })
  }

  // on page load, set company_user's "recently viewed" tag
  useEffect(() => {
    const setupTags = async () => {
      if (!hasSetRecentlyViewed && !!dataset?.id) {
        // If company_user doesn't have "Recently Viewed" tag - created it
        const newTagId = await ensureCompanyTagForUser({ tagName: RECENTLY_VIEWED })

        // otherwise find the recently viewed tag
        const existingRecentlyViewedTagId = tags.find((tag) => tag.tag === RECENTLY_VIEWED)?.id

        if (!isEmpty(newTagId) || !isEmpty(existingRecentlyViewedTagId)) {
          await createResourceTag({
            variables: {
              resource_id: dataset.id,
              tag_id: existingRecentlyViewedTagId || newTagId,
              related_to: ITag_Relations_Enum.Dataset,
            },
          })
        }

        // only set recently viewed tag once per page visit
        setHasSetRecentlyViewed(true)
      }
    }

    setupTags()
  }, [hasSetRecentlyViewed, dataset?.id, ensureCompanyTagForUser, createResourceTag, tags])

  // On mount, make sure to refetch the company seed request
  // just in case user updated available activity stream tables:
  useEffect(() => {
    if (refetchCompanySeed) {
      // REFRESH TABLES
      refetchCompanySeed()
    }
  }, [refetchCompanySeed])

  // Wait for activityStream to be set, then get activities
  useEffect(() => {
    if (company.slug && activityStream) {
      doActivitiesQuery({
        variables: {
          activity_stream: activityStream,
          company_slug: company.slug,
        },
      })
    }
  }, [doActivitiesQuery, activityStream, company.slug])

  // Refresh list of activities so all activity selects are always up to date:
  //
  // We used to get this data from the company seed request, but it's possible
  // a user updates a transformation or activity in one tab, and switches back to
  // dataset without a page refresh.
  //
  // This makes sure activities are refreshed every time the definition opens!
  useEffect(() => {
    if (
      company.slug &&
      activityStream &&
      isFunction(refreshGraphActivities) &&
      editingDefinition &&
      editingDefinition !== prevEditingDefinition
    ) {
      refreshGraphActivities({
        company_slug: company.slug,
        activity_stream: activityStream,
      })
    }
  }, [refreshGraphActivities, editingDefinition, prevEditingDefinition, activityStream, company.slug])

  // runDataset should be fired from within useEffect so we can cancel/not update state when user navigates away
  // this needs to be in one giant function so it has access to isSubscribedToRunningQueries
  // https://juliangaramendy.dev/use-promise-subscription/
  useEffect(
    () => {
      const runDataset = async ({
        queryDefinition,
        runGroupSlug,
        runOptions,
      }: {
        queryDefinition: IDatasetQueryDefinition
        runGroupSlug?: string | null
        runOptions?: any
      }) => {
        apiStateDispatch({
          type: RUN_DATASET_QUERY_REQUEST,
          slug: dataset_slug,
          groupSlug: runGroupSlug,
          // FIXME - will this cause garbage collection issues?
          // using cloneDeep so the reducer gets a whole new object, not just the
          // reference to the queryDefinition
          queryDefinition: cloneDeep(queryDefinition),
        })

        try {
          const response = await fetchRunDataset({
            ...runOptions,
            getToken: getTokenSilently,
            company,
            groupSlug: runGroupSlug,
            queryDefinition,
            signal: controllerRef.current.signal,
          })

          if (isSubscribedToRunningQueries.current) {
            apiStateDispatch({
              type: RUN_DATASET_QUERY_SUCCESS,
              slug: dataset_slug,
              payload: response,
              groupSlug: runGroupSlug,
            })
          }

          return response
        } catch (error: any) {
          // Ignore cancellations
          if (error.name !== 'AbortError' && isSubscribedToRunningQueries.current) {
            reportError('Run Dataset Error', error, {
              datasetSlug: dataset_slug,
              groupSlug: runGroupSlug,
              queryDefinition,
            })

            apiStateDispatch({
              type: RUN_DATASET_QUERY_FAILURE,
              slug: dataset_slug,
              error,
              groupSlug: runGroupSlug,
            })
          }

          // Return an error so we won't run runCount and know to cancel
          return { error }
        }
      }

      const runCount = async ({
        queryDefinition,
        runGroupSlug,
        runLive,
      }: {
        queryDefinition: IDatasetQueryDefinition
        runGroupSlug?: string | null
        runLive?: boolean
      }) => {
        apiStateDispatch({
          type: RUN_DATASET_COUNT_REQUEST,
          slug: dataset_slug,
          groupSlug: runGroupSlug,
          queryDefinition,
        })

        try {
          const response = await fetchRunDatasetCount({
            runLive,
            getToken: getTokenSilently,
            company,
            groupSlug: runGroupSlug,
            queryDefinition,
            signal: controllerRef.current.signal,
          })

          if (isSubscribedToRunningQueries.current) {
            apiStateDispatch({
              type: RUN_DATASET_COUNT_SUCCESS,
              slug: dataset_slug,
              payload: response,
              groupSlug: runGroupSlug,
            })
          }
        } catch (error: any) {
          // Ignore cancellations
          if (error.name !== 'AbortError' && isSubscribedToRunningQueries.current) {
            reportError('Run Dataset Metrics Error', error, {
              datasetSlug: dataset_slug,
              groupSlug: runGroupSlug,
              queryDefinition,
            })

            apiStateDispatch({
              type: RUN_DATASET_COUNT_FAILURE,
              slug: dataset_slug,
              error,
              groupSlug: runGroupSlug,
            })
          }

          // Return an error so we know to cancel
          return { error }
        }
      }

      const cancelCurrentlyRunningQueries = async ({
        datasetApiStates,
        queryDefinition,
        runGroupSlug,
        runOptions,
      }: {
        datasetApiStates: IDatasetReducerState
        queryDefinition: IDatasetQueryDefinition
        runGroupSlug?: string | null
        runOptions: any
      }) => {
        const tabApiData = get(datasetApiStates, runGroupSlug || RAW_DATASET_KEY)
        const currentQueryData = get(tabApiData, ACTION_TYPE_QUERY)
        const currentMetricData = get(tabApiData, ACTION_TYPE_COUNT)

        // if you're currently loading the query for this dataset tab:
        if (
          currentQueryData?.queryDefinition &&
          currentQueryData?.loading &&
          !isEqual(currentQueryData.queryDefinition, queryDefinition)
        ) {
          try {
            await fetchRunDataset({
              ...runOptions,
              getToken: getTokenSilently,
              company,
              groupSlug: runGroupSlug,
              queryDefinition: currentQueryData.queryDefinition,
              cancel: true,
            })
          } catch (err) {
            // Do nothing if cancellation fails
            logger.error({ err }, 'Cancel error')
          }
        }
        // if you're currently loading count for this dataset tab:
        if (
          currentMetricData?.queryDefinition &&
          currentMetricData?.loading &&
          !isEqual(currentMetricData.queryDefinition, queryDefinition)
        ) {
          try {
            await fetchRunDatasetCount({
              getToken: getTokenSilently,
              company,
              groupSlug: runGroupSlug,
              queryDefinition: currentMetricData.queryDefinition,
              runLive: runOptions?.runLive,
              cancel: true,
            })
          } catch (err) {
            // Do nothing if cancellation fails
            logger.error({ err }, 'Cancel error')
          }
        }
      }

      const runDatasetQueries = async ({
        datasetApiStates,
        queryDefinition,
        runGroupSlug,
        runOptions,
      }: {
        datasetApiStates: IDatasetReducerState
        queryDefinition: IDatasetQueryDefinition
        runGroupSlug?: string | null
        runOptions: any
      }) => {
        ////////// TRACK RUNNING DATASET //////////
        analytics.track('ran_dataset', {
          dataset_slug: dataset_slug,
          group_slug: runGroupSlug,
        })

        machineSend('DATASET_RUN')

        ////////// CANCEL CURRENTLY RUNNING QUERIES IF RE-RUN //////////
        await cancelCurrentlyRunningQueries({ datasetApiStates, queryDefinition, runGroupSlug, runOptions })

        ////////// Run the queries //////////
        const runDatasetResponse = await runDataset({ queryDefinition, runGroupSlug, runOptions })

        // If there's an error try to cancel the run dataset request:
        if (get(runDatasetResponse, 'error') && get(runDatasetResponse, 'error.name') !== 'AbortError') {
          try {
            await fetchRunDataset({
              ...runOptions,
              getToken: getTokenSilently,
              company,
              groupSlug: runGroupSlug,
              queryDefinition,
              cancel: true,
            })
          } catch (err) {
            // Do nothing if cancellation fails
            logger.error({ err }, 'Cancel error')
          }
        }

        // - If the query only got approximate metrics (is_approx === true)
        // - And there's no error
        // - Kick off a request to get the actual total row count
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (runDatasetResponse.is_approx && !get(runDatasetResponse, 'error') && isSubscribedToRunningQueries.current) {
          const runCountResponse = await runCount({ queryDefinition, runGroupSlug, runLive: runOptions?.runLive })

          // If there's an error try to cancel the count request:
          if (get(runCountResponse, 'error') && get(runCountResponse, 'error.name') !== 'AbortError') {
            try {
              await fetchRunDatasetCount({
                getToken: getTokenSilently,
                company,
                groupSlug: runGroupSlug,
                queryDefinition,
                runLive: runOptions?.runLive,
                cancel: true,
              })
            } catch (err) {
              // Do nothing if cancellation fails
              logger.error({ err }, 'Cancel error')
            }
          }
        }

        if (isSubscribedToRunningQueries.current) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          machineSend('DATASET_RUN_DONE', { groupSlug: runGroupSlug, notification: runDatasetResponse?.notification })
        }
      }

      // Don't duplicate calls!
      if (!isEmpty(runDatasetParams) && runDatasetParams) {
        const { datasetApiStates, queryDefinition, runGroupSlug, runOptions, runOverride } = runDatasetParams

        // if passed run all override, get all groups and parent dataset
        if (runOverride && runOverride === RUN_DATASET_OVERRIDE_ALL) {
          forEach(queryDefinition.query.all_groups, (group) => {
            if (group.slug) {
              // run each group
              runDatasetQueries({ datasetApiStates, queryDefinition, runGroupSlug: group.slug, runOptions })
            }
          })
          // run parent
          runDatasetQueries({ datasetApiStates, queryDefinition, runGroupSlug: undefined, runOptions })
        } else {
          // no override passed, just run which tab was (re)run
          runDatasetQueries({ datasetApiStates, queryDefinition, runGroupSlug, runOptions })
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getTokenSilently, company.slug, dataset_slug, runDatasetParams]
  )

  // On unmount
  // - abort the controllerRef.current.signal so all queries are canceled
  // - set isSubscribedToRunningQueries.current to false so we don't dispatch any more
  // api events to the datasetReducer
  useEffect(() => {
    return () => {
      isSubscribedToRunningQueries.current = false
      controllerRef.current.abort()

      cancelAllDatasetApiRequests({
        getToken: getTokenSilently,
        company,
        groupSlug,
        selectedApiData,
        runningAllTabs,
      })
    }
  }, [])

  // Load Form State On Mount
  // Check for group slug in url
  useEffect(() => {
    if (machineMainIsIdle) {
      // Look for ?slug= query param for duplicate flow
      // Look for ?group= query param for loading a group by tab directly
      // Look for ?view= query param for loading table, SQL, or plot
      //// Note: when view=plot you will have to add the plot slug when machine state is 'ready'
      const { slug, group, view, upload_key, narrative_slug } = queryString.parse(search)

      if (slug && !dataset_slug) {
        machineSend('LOAD', { slug: slug, isDuplicate: true, view, upload_key, narrative_slug })
      }

      if (dataset_slug) {
        machineSend('LOAD', { slug: dataset_slug, groupSlugFromSearch: group, view, upload_key, narrative_slug })
      }

      machineSend('NEW', { tables })
    }
  }, [machineMainIsIdle, dataset_slug, machineSend, search, tables])

  // TODO: remove me. here for debugging
  // log whenever machine current changes
  useEffect(() => {
    const { event, _event, ...current } = machineCurrent
    logger.debug({ event, machine: current }, `Dataset state update ${event.type}`)
  }, [machineCurrent])

  const methods = useForm<any>({
    defaultValues: definitionContext.form_value,
    mode: 'all',
  })

  const { handleSubmit, formState, reset } = methods
  const { isValid } = formState

  // Reset form state any time the machine's _definition_context updates
  useEffect(() => {
    if (definitionContext.form_value) {
      reset(definitionContext.form_value)
    }
  }, [definitionContext.form_value, reset])

  // this onSubmit is for the DatasetDefinition Drawer
  const [hasSubmittedDefinition, setHasSubmittedDefinition] = useState(false)
  const onDefinitionSubmit = handleSubmit((formValue: any) => {
    machineSend('SUBMIT_DEFINITION', { formValue })
    setHasSubmittedDefinition(true)
  })

  if (machineMainHasError) {
    return (
      <Box mb={2}>
        <Result status="warning" title={machineError?.message} subTitle="Is it possible this dataset does not exist?" />
      </Box>
    )
  }

  if (machineMainIsLoading || machineMainIsIdle) {
    return (
      <Box mt={4}>
        <Result icon={<Spin size="large" />} title={`Loading ${dataset?.name || 'dataset'}...`} />
      </Box>
    )
  }

  const datasetNameOrSlug = dataset?.name || dataset?.slug
  const pageTitle = datasetNameOrSlug || 'Dataset Editor | Narrator'

  return (
    <Page
      hideChat
      title={pageTitle}
      bg="transparent"
      breadcrumbs={[
        { url: '/datasets', text: 'Datasets' },
        { text: datasetNameOrSlug ? truncate(datasetNameOrSlug, { length: 29 }) : 'new' },
      ]}
    >
      <DatasetFormContext.Provider
        value={{
          activityStream: machineCurrent.context.activity_stream,
          activitiesLoading,
          dataset,
          datasetSlug: dataset_slug,
          groupIndex,
          groupSlug,
          hasSubmittedDefinition,
          handleToggleSensitiveInfo,
          handleToggleShowJson,
          handleOpenIntegrationOverlay,
          hasMultipleStreams: tables.length > 1,
          obscureSensitiveInfo,
          onRunDataset: handleRunDataset,
          onOpenToolOverlay: handleOpenToolOverlay,
          selectedApiData,
          datasetApiStates,
          parentApiData: (datasetApiStates as IDatasetReducerState)[RAW_DATASET_KEY],
          streamActivities,
          toolOverlay,
          // current and send are from state machine
          machineCurrent: machineCurrent as unknown as DatasetMachineState,
          machineSend,
        }}
      >
        <DatasetErrorBoundary
          handleCloseToolOverlay={handleCloseToolOverlay}
          queryDefinition={get(selectedApiData, [ACTION_TYPE_QUERY, 'queryDefinition'])}
        >
          {/*
            Check for form changes (reset after save)
            Prevent Back if necessary
          */}
          <PreventBackListener
            selectedApiData={selectedApiData}
            groupSlug={groupSlug}
            controller={controllerRef.current}
            runningAllTabs={runningAllTabs}
          />

          <QuickSaveListener />

          <DatasetNotifications />
          <AutoRun setRunDatasetParams={setRunDatasetParams} />
          <DirtyFormChecker />
          <StaleFormChecker datasetApiStates={datasetApiStates} />

          <QueryParamUpdater groupIndex={groupIndex} onUpdateIndex={setGroupIndex} />

          <ToolModal
            toolOverlay={toolOverlay}
            toolOverlayProps={toolOverlayProps}
            handleCloseToolOverlay={handleCloseToolOverlay}
          />

          {showJson && jsonValue && (
            <Suspense fallback={null}>
              <DatasetJsonModal onClose={() => setShowJson(false)} value={jsonValue} />
            </Suspense>
          )}

          <FormProvider {...methods}>
            <form onSubmit={onDefinitionSubmit} style={{ width: '100%' }}>
              <PageWrapper>
                <Spin spinning={machineMainIsProcessing} size="large" tip="processing..." style={{ width: '100%' }}>
                  <FromNarrativeBanner />

                  <FixedSider
                    style={{
                      top: showFromNarrativeBanner ? `${SHOW_NARRATIVE_BANNER_OFFSET}px` : 0,
                      background: colors.gray200,
                    }}
                  >
                    <Box pl={3} pr={2}>
                      <GlobalCTA handleRunAllTabs={handleRunAllTabs} style={{ position: 'relative', zIndex: 1 }} />
                      <Measure>
                        {({ measureRef, contentRect }) => (
                          <StyledSiderFlex
                            drawerVisible={editingDefinition}
                            heightAdjust={contentRect?.entry?.height}
                            flexDirection="column"
                            showFromNarrativeBanner={showFromNarrativeBanner}
                          >
                            <div ref={measureRef}>
                              <DatasetTabCTA
                                drawerVisible={editingDefinition}
                                cancelRunDataset={cancelRunDataset}
                                cancelRunCount={cancelRunCount}
                              />
                            </div>

                            {/* // IMPORTANT CALLOUTS
                              // - added id INFO_PANEL_CONTAINER_ID to give an element ID to access for scroll logic in machineServices.js
                              // - added position relative so element.offsetTop will work when calculating scroll positions 
                              // - don't allow delete on duplicate parent groups
                              */}
                            <>
                              {!editingDefinition && !isDuplicateParentGroup && (
                                <Flex
                                  justifyContent={
                                    !isEmpty(deleteColumnsMode?.deleteColumnsIds) ? 'space-between' : 'flex-end'
                                  }
                                  py={2}
                                  style={{ minHeight: '56px' }}
                                >
                                  {!isEmpty(deleteColumnsMode?.deleteColumnsIds) && (
                                    <Button
                                      data-test="delete-columns-cta"
                                      size="small"
                                      type="primary"
                                      danger
                                      onClick={() => {
                                        machineSend('DELETE_EDIT_MODE_COLUMNS', { groupSlug })
                                      }}
                                    >
                                      Delete Columns
                                    </Button>
                                  )}

                                  <Tooltip
                                    title={
                                      deleteColumnsMode
                                        ? 'Exit delete multiple columns mode'
                                        : 'Enter delete multiple columns mode'
                                    }
                                  >
                                    <Switch
                                      data-test="toggle-delete-columns"
                                      checked={!!deleteColumnsMode}
                                      unCheckedChildren={<DeleteOutlined />}
                                      checkedChildren={<DeleteOutlined />}
                                      onChange={() => {
                                        machineSend('TOGGLE_DELETE_COLUMNS_MODE', {
                                          tabName: groupSlug ? groupSlug : RAW_DATASET_KEY,
                                        })
                                      }}
                                    />
                                  </Tooltip>
                                </Flex>
                              )}

                              {/* Don't show info panel if it's a duplicate parent group and NOT edit mode*/}
                              {(!isDuplicateParentGroup || (isDuplicateParentGroup && editingDefinition)) && (
                                <Box
                                  id={INFO_PANEL_CONTAINER_ID}
                                  ml="-4px"
                                  flexGrow={1}
                                  style={{ position: 'relative', overflow: 'auto', minHeight: 0 }}
                                >
                                  {!groupSlug || editingDefinition ? <ParentColumns /> : <GroupColumns />}
                                </Box>
                              )}

                              {/* Show markdown field for duplicate parent group UNLESS edit mode*/}
                              {isDuplicateParentGroup && !editingDefinition && <DuplicateParentMarkdown />}
                            </>
                          </StyledSiderFlex>
                        )}
                      </Measure>
                    </Box>
                  </FixedSider>

                  <StyledLayoutContent
                    bg="transparent"
                    drawerVisible={editingDefinition}
                    showFromNarrativeBanner={showFromNarrativeBanner}
                  >
                    <TabHeaders
                      datasetApiStates={datasetApiStates}
                      style={{
                        transition: 'opacity 150ms ease-in-out',
                        transitionDelay: '200ms',
                        opacity: editingDefinition ? 0 : 1,
                      }}
                    />

                    <StyledContentFlex pt={2} bg="white" drawerVisible={editingDefinition}>
                      <StyledBox flexGrow={1}>
                        {view === viewTypeConstants.SQL && <SQLView />}
                        {view === viewTypeConstants.TABLE && (
                          <>
                            {/* Right click events */}
                            <GridContextMenu selectCustomerJourney={selectCustomerJourney} />

                            <QueryLoadingTimer
                              onCancelRunDataset={cancelRunDataset}
                              onCancelRunCount={cancelRunCount}
                            />
                            <DatasetTable key={groupSlug} />
                          </>
                        )}
                        {view === viewTypeConstants.PLOT && <Plotter />}
                      </StyledBox>
                      {/* only show customer drawer on parent or duplicate parent group */}
                      {(isEmpty(groupSlug) || isDuplicateParentGroup) && (
                        <CustomerDrawer
                          customerJourneyRow={customerJourneyRow}
                          customerJourneyOptions={customerJourneyOptions}
                          setCustomerJourneyRow={setCustomerJourneyRow}
                          queryDefinition={machineQueryDefinition}
                        />
                      )}
                    </StyledContentFlex>
                    <DatasetDefinition
                      drawerVisible={editingDefinition}
                      handleSubmit={onDefinitionSubmit}
                      invalid={!isValid}
                      streamActivities={streamActivities}
                    />
                    <Reconciler />
                  </StyledLayoutContent>
                </Spin>
              </PageWrapper>
            </form>
          </FormProvider>
        </DatasetErrorBoundary>
      </DatasetFormContext.Provider>
    </Page>
  )
}

export default BuildDataset
