import { Collapse, Spin } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { WithinTimeFilterDefaultValues } from 'components/Datasets/BuildDataset/tools/shared/ReactHookForm/QuickTimeFilter'
import DynamicPlot, { Props as DynamicPlotProps } from 'components/shared/DynamicPlot'
import DynamicPlotHeightWrapper from 'components/shared/DynamicPlotHeightWrapper'
import { Box, Typography } from 'components/shared/jawns'
import { useLayoutContext } from 'components/shared/layout/LayoutProvider'
import { FixedSider, LayoutContent } from 'components/shared/layout/LayoutWithFixedSider'
import { ICompany_Table } from 'graph/generated'
import { find, flatten, isEmpty, isEqual, isObject, isString, toNumber, toString } from 'lodash'
import queryString from 'query-string'
import React, { RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { RouteComponentProps, useHistory, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { useDebouncedCallback } from 'use-debounce'
import { colors, SIDENAV_WIDTH, SIDENAV_WIDTH_COLLAPSED } from 'util/constants'
import { timeFromNow } from 'util/helpers'
import { makeShortid } from 'util/shortid'
import usePrevious from 'util/usePrevious'
import useQueryParams from 'util/useQueryParams'

import { getLogger } from '@/util/logger'

import ActivityStream from './ActivityStream'
import { TOPBAR_HEIGHT } from './constants'
import CustomerProfile from './CustomerProfile'
import FormFilters from './FormFilters'
import CustomerAutoComplete from './FormItems/CustomerAutoComplete'
import { DEFAULT_DEPTH } from './FormItems/DepthInput'
import FormCtas from './FormItems/FormCtas'
import { DEFAULT_TIME_BETWEEN, DEFAULT_TIME_BETWEEN_RESOLUTION } from './FormItems/VisualizationTimeBetween'
import Header from './Header'
import { CUSTOMER_KIND_CUSTOMER, GET_CUSTOMER_JOURNEY_LIMIT } from './services/constants'
import { ICustomerJourneyQueryParams } from './services/interfaces'
import useGetCustomerJourneyMachine from './services/useGetCustomerJourneyMachine'

const logger = getLogger()

interface defaultTimeFilter {
  operator: string
  value: WithinTimeFilterDefaultValues
}
export const DEFAULT_TIME_FILTER: defaultTimeFilter = { operator: 'quick_time_filter', value: 'last_60_days' }
// "unselected" is used when the user manually clears the time filter
// this prevents us setting the default time on shared links/page refresh
export const TIME_FILTER_UNSELECTED = 'unselected'

export const FILTER_COLLAPSE_KEY = 'customer-journey-filters'

export type FormData = {
  start_activity?: string | null
  activities?: string[]
  only_first_occurrence?: boolean
  timestamp?: string | null
  asc: boolean
  table: string
  customer_kind: string
  customer?: string | null
  categories?: string[]
  time_filter?:
    | {
        operator?: string
        [key: string]: any
      }
    | string
  as_visual?: boolean
  depth?: number
  hide_activities?: boolean | null
  time_between?: number | null
  time_between_resolution?: string | null
}

const StyledContainer = styled(Box)<{ collapsed: boolean }>`
  position: relative;
  width: ${({ collapsed }) =>
    collapsed ? `calc(100vw - ${SIDENAV_WIDTH_COLLAPSED}px)` : `calc(100vw - ${SIDENAV_WIDTH}px)`};
`

const FormCollapseContainer = styled.div<{ isCollapsible: boolean }>`
  .antd5-collapse-header {
    align-items: center !important;
    padding: 0 !important;

    .antd5-collapse-header-text {
      color: black;
    }

    &:hover {
      cursor: ${({ isCollapsible }) => (isCollapsible ? `pointer` : `auto`)};
    }
  }

  .antd5-collapse-content-box {
    padding: 0 !important;
  }
`

const ContentContainer = styled(Box)`
  position: sticky;
  height: calc(100% - ${TOPBAR_HEIGHT}px);
  top: ${TOPBAR_HEIGHT}px;
`

const Customer: React.FC<RouteComponentProps> = () => {
  const company = useCompany()
  const history = useHistory()
  const { collapsed } = useLayoutContext()
  const [queryParams, setQueryParams] = useQueryParams()

  const [activeKeys, setActiveKeys] = useState<string | string[]>([FILTER_COLLAPSE_KEY])

  // refetch customer attributes when user clears cache and runs (run live)
  const [refetchCustomerAttributes, setRefetchCustomerAttributes] = useState(false)

  // on success of refetch, set to false to not fire again
  const handleRefetchCustomerAttributesSuccess = () => {
    setRefetchCustomerAttributes(false)
  }

  const timelineRef = useRef()
  const timelineElement = timelineRef?.current as HTMLDivElement | undefined

  // using ref for hasLoaded
  // b/c we don't want to trigger a re-render
  // which could trigger firing the getCustomerJourney unneccesarily
  const hasLoadedRef = useRef<boolean>(false)

  // b/c we fetch customer journey when query params update (submit in FormFilters)
  // keep track if should be run_live or not here (resetting to false after submit)
  // (use ref to not trigger re-render -> double fetches)
  const runLiveRef = useRef<boolean>(false)
  const handleShouldRunLive = useCallback(() => {
    runLiveRef.current = true
    setRefetchCustomerAttributes(true)
  }, [])

  // grab customer table config if exists
  const { table: tableName } = useParams<{ table: string }>()
  const table = find(company.tables, ['activity_stream', tableName]) as ICompany_Table
  if (!table) {
    // If the table specified by the :table route parameter in the route is not found,
    // navigate back to /{company_slug}/customer_journey and let the logic there take over
    history.replace({
      ...history.location,
      pathname: `/${company.slug}/customer_journey`,
    })
  }

  const tableActivityStream = table?.activity_stream

  const {
    start_activity,
    activities: activitiesParam,
    only_first_occurrence,
    customer,
    customer_kind,
    timestamp,
    asc = false,
    time_filter,
    as_visual,
    run_live: runLiveParam,
    depth,
    hide_activities,
    time_between,
    time_between_resolution,
  } = queryParams as unknown as ICustomerJourneyQueryParams

  const {
    data: customerJourneyData,
    error: customerJourneyError,
    cancelRequest: cancelFetchCustomerJourney,
    fetch: fetchCustomerJourney,
    isLoading,
    isInfiniteLoading,
    isSuccessful,
  } = useGetCustomerJourneyMachine()

  const activities = activitiesParam ? flatten([activitiesParam]) : undefined
  const activitiesAsString = activities?.join(',')

  const decodedCustomer = customer ? decodeURIComponent(customer) : ''
  const prevDecodedCustomer = usePrevious(decodedCustomer)

  // Memoize decodedTimeFilter so we don't call
  // getCustomerJourney over and over
  const decodedTimeFilter = useMemo(() => {
    // if there is no time filter from query params
    // and it's the first time loading
    // add default time_filter value
    const hasLoaded = hasLoadedRef?.current
    if (!hasLoaded && !time_filter) {
      return DEFAULT_TIME_FILTER
    }

    // if they manually cleared the time_filter
    // pass no values to mavis/form state
    // also don't try to atob parse "unselected" below
    if (time_filter === TIME_FILTER_UNSELECTED) {
      return undefined
    }

    // otherwise return the time_filter from query params
    if (time_filter) {
      return JSON.parse(atob(time_filter))
    }

    // otherwise it wasn't the first time loading (so don't add default)
    // and there wasn't a time_filter query param
    return undefined
  }, [time_filter])

  const valuesFromParams = {
    customer: decodedCustomer,
    table: tableActivityStream,
    activities: activities || [],
    only_first_occurrence,
    timestamp,
    asc,
    customer_kind: customer_kind || CUSTOMER_KIND_CUSTOMER,
    time_filter: decodedTimeFilter,
    as_visual,
    start_activity,
    run_live: runLiveParam,
    depth: depth ? toNumber(depth) : undefined,
    hide_activities,
    time_between: time_between ? toNumber(time_between) : undefined,
    time_between_resolution,
  }

  const methods = useForm<FormData>({
    defaultValues: valuesFromParams,
    mode: 'all',
  })
  const { reset, handleSubmit, setValue } = methods

  const asVisualization = valuesFromParams?.as_visual

  const onSubmit = handleSubmit(
    ({
      table,
      customer,
      activities,
      start_activity,
      only_first_occurrence,
      timestamp,
      asc,
      customer_kind,
      time_filter,
      depth,
      hide_activities,
      time_between,
      time_between_resolution,
    }: FormData) => {
      let timeFilter
      // check if time_filter was manually unselected
      if (time_filter === TIME_FILTER_UNSELECTED) {
        timeFilter = TIME_FILTER_UNSELECTED
        // otherwise see if it the an actual time_filter object
      } else if (isObject(time_filter) && !isEmpty(time_filter?.operator)) {
        timeFilter = btoa(JSON.stringify(time_filter))
      }

      // if runLive - update query params with randomized string for runLive
      // this will trigger another request for customer data (and clearing cache)
      const runLive = runLiveRef?.current ? makeShortid() : undefined

      const stringifiedParams = queryString.stringify(
        {
          // `undefined` makes it so that the query param
          // is removed from the URL. Any other value (ie, NULL)
          // still puts the query param, but with an empty value
          customer: customer ? customer : undefined,
          customer_kind: customer_kind ? customer_kind : undefined,
          activities: activities ? activities : undefined,
          only_first_occurrence: only_first_occurrence ? only_first_occurrence : undefined,
          timestamp: !timestamp ? undefined : timestamp,
          // since we default to `false`, if the value is false
          // simply remove it from the URL query string params
          asc: !asc ? undefined : asc,
          time_filter: timeFilter,
          run_live: runLive,
          hide_activities: hide_activities ? true : undefined,
          // visualization only below
          as_visual: asVisualization || undefined,
          start_activity: asVisualization ? start_activity : undefined,
          depth: asVisualization ? depth : undefined,
          time_between: asVisualization ? time_between : undefined,
          time_between_resolution: asVisualization ? time_between_resolution : undefined,
        },
        { arrayFormat: 'comma' }
      )

      // let's scroll back to the top of the page
      scrollTimelineToTop()

      // Take all the form values and append them
      // as search params on the URL. useEffect in
      // `Customer.tsx` will be listening to these
      // params and will trigger data load when they change
      history.push({
        pathname: `/${company.slug}/customer_journey/${table}`,
        search: stringifiedParams,
      })
    }
  )

  const handleRunLive = useCallback(() => {
    if (!isLoading) {
      handleShouldRunLive()

      onSubmit()
    }
  }, [onSubmit, handleShouldRunLive, isLoading])

  const handleReset = useCallback(
    ({ valueOverrides }: { valueOverrides?: Partial<FormData> }) => {
      const resetAndUpdateParams = async () => {
        // reset form state

        const valuesWithOverrides = {
          table: valuesFromParams.table,
          customer_kind: valuesFromParams.customer_kind,
          customer: null,
          activities: [],
          only_first_occurrence: false,
          timestamp: null,
          time_filter: DEFAULT_TIME_FILTER,
          asc: false,
          as_visual: false,
          start_activity: null,
          hide_activities: null,
          time_between: null,
          time_between_resolution: null,
          // valueOverrides are useful when updating the activity stream
          // to maintain things like time_filter, asc...
          // which don't depend on the activity stream
          ...(valueOverrides || {}),
        }

        await reset(valuesWithOverrides)

        // submit form to get new results
        onSubmit()

        // open the filters again
        setActiveKeys([FILTER_COLLAPSE_KEY])
      }

      resetAndUpdateParams()
    },
    [onSubmit, reset, valuesFromParams]
  )

  const handleToggleTimelineVisualization = (asVisual: boolean) => {
    const updatedParams = {
      ...queryParams,
      as_visual: asVisual ? true : undefined,
      depth: asVisual ? DEFAULT_DEPTH : undefined,
      time_between: asVisual ? DEFAULT_TIME_BETWEEN : undefined,
      time_between_resolution: asVisual ? DEFAULT_TIME_BETWEEN_RESOLUTION : undefined,
    }

    setQueryParams(updatedParams)
  }

  // update customer when params change
  // (i.e. user clicks on user name - rather than enters it)
  useEffect(() => {
    if (decodedCustomer && !isEqual(prevDecodedCustomer, decodedCustomer)) {
      setValue('customer', decodedCustomer, { shouldValidate: true })
    }
  }, [setValue, prevDecodedCustomer, decodedCustomer])

  // open/close customer journey filters when a customer is (de)selected
  useEffect(() => {
    // close when customer selected
    if (!as_visual && decodedCustomer && !isEqual(prevDecodedCustomer, decodedCustomer)) {
      setActiveKeys([])
    }

    // open when customer is deselected
    if (!as_visual && !decodedCustomer && !isEqual(prevDecodedCustomer, decodedCustomer)) {
      setActiveKeys([FILTER_COLLAPSE_KEY])
    }
  }, [prevDecodedCustomer, decodedCustomer, as_visual])

  // TODO: handle end of journey (no more rows to fetch)
  const debouncedInfiniteScrollCallback = useDebouncedCallback(() => {
    // if you've reached the 70% of the bottom of the page
    // https://css-tricks.com/how-i-put-the-scroll-percentage-in-the-browser-title-bar/
    const scrollTop = timelineElement?.scrollTop || 0
    const elementHeight = timelineElement?.scrollHeight || 0
    const winHeight = window.innerHeight
    const scrollPercent = scrollTop / (elementHeight - winHeight)

    if (scrollPercent >= 0.7) {
      // and there is more to scroll to + isn't loading or are errors
      if (
        customerJourneyData &&
        customerJourneyData?.data?.rows?.length % GET_CUSTOMER_JOURNEY_LIMIT === 0 &&
        !isLoading &&
        !isInfiniteLoading &&
        !customerJourneyError &&
        isSuccessful
      ) {
        fetchCustomerJourney({
          table: tableActivityStream,
          customer: decodedCustomer,
          customer_kind: customer_kind,
          activities,
          only_first_occurrence: !!only_first_occurrence,
          timestamp,
          // only use asc when in timeline mode
          asc: as_visual ? undefined : asc,
          offset: customerJourneyData?.data?.rows?.length,
          time_filter: decodedTimeFilter,
          as_visual,
          // only use start_activity when visualizing
          start_activity: as_visual ? start_activity : undefined,
          hide_activities: hide_activities ? true : undefined,
          // don't need time_between or time_between_resolution when visualizing
        })
      }
    }
  }, 100)

  useEffect(() => {
    const controller = new AbortController()
    // use ref to determine run_live to ensure the user
    // clicked "Clear Cache" and wasn't sent a link with "run_live"
    const runLive = runLiveRef.current

    fetchCustomerJourney(
      {
        ...queryParams,
        table: tableActivityStream,
        customer: decodedCustomer,
        customer_kind,
        activities: activitiesAsString?.split(','),
        only_first_occurrence: !!only_first_occurrence,
        timestamp,
        // only use asc when in timeline mode
        asc: as_visual ? undefined : asc,
        time_filter: decodedTimeFilter,
        as_visual,
        // only use start_activity when visualizing
        start_activity: as_visual ? start_activity : undefined,
        runLive: !!runLiveParam && runLive,
        depth: isString(depth) ? toNumber(depth) : depth,
        hide_activities: hide_activities ? true : undefined,
        time_between: isString(time_between) ? toNumber(time_between) : time_between,
        time_between_resolution: as_visual ? time_between_resolution : undefined,
      },
      controller
    )

    // make sure we toggle off runLive (if it was set) only trigger if "Clear Cache" button is hit
    runLiveRef.current = false

    return () => {
      cancelFetchCustomerJourney()
    }
  }, [fetchCustomerJourney, JSON.stringify(queryParams), tableActivityStream, cancelFetchCustomerJourney])

  // Add/Remove infinite scroll listeners
  useEffect(() => {
    // add infinite scroll
    logger.debug('Add Infinite Scroll listener - Customer Journey')
    timelineElement?.addEventListener('scroll', debouncedInfiniteScrollCallback)

    return () => {
      // remove infinite scroll on unmount
      logger.debug('Remove Infinite Scroll listener - Customer Journey')
      timelineElement?.removeEventListener('scroll', debouncedInfiniteScrollCallback)
      debouncedInfiniteScrollCallback.cancel()
    }
  }, [debouncedInfiniteScrollCallback, timelineElement])

  // scroll to id from 'go_to_row_id' when receiving a new customer journey response
  useEffect(() => {
    if (customerJourneyData?.go_to_row_id || customerJourneyData?.go_to_row_id === 0) {
      const elementToScrollTo = document.getElementById(`${toString(customerJourneyData?.go_to_row_id)}`)

      if (timelineElement && elementToScrollTo) {
        const y = elementToScrollTo.getBoundingClientRect().top + window.pageYOffset - 250
        timelineElement.scrollTo({ top: y, behavior: 'smooth' })
      }
    }
  }, [customerJourneyData, timelineElement])

  const scrollTimelineToTop = () => {
    if (timelineElement) {
      timelineElement.scrollTo({ top: 0 })
    }
  }

  const lastRetrievedAgo = useMemo(() => {
    if (customerJourneyData?.retrieved_at) {
      return timeFromNow(customerJourneyData.retrieved_at, company.timezone)
    }

    return undefined
  }, [customerJourneyData?.retrieved_at, timeFromNow, company.timezone])

  const showCustomerProfile = !!(decodedCustomer && !as_visual)

  // ensure the filters are showing on visualization
  // (no customer info shows and can get stuck without filters)
  useEffect(() => {
    if (as_visual && isEmpty(activeKeys)) {
      setActiveKeys(FILTER_COLLAPSE_KEY)
    }
  }, [as_visual, activeKeys])

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit}>
        <StyledContainer collapsed={collapsed}>
          {/* Left Side */}
          <FixedSider style={{ background: 'white', borderRight: `1px solid ${colors.gray300}`, overflowY: 'auto' }}>
            <>
              <Box p={3}>
                <FormCollapseContainer isCollapsible={showCustomerProfile}>
                  <Collapse
                    expandIconPosition="end"
                    activeKey={activeKeys}
                    ghost
                    bordered={false}
                    onChange={(values) => {
                      setActiveKeys(values)
                    }}
                  >
                    <Collapse.Panel
                      showArrow={showCustomerProfile}
                      collapsible={showCustomerProfile ? 'header' : 'disabled'}
                      header={<Typography type="title300">Customer Journey</Typography>}
                      key={FILTER_COLLAPSE_KEY}
                    >
                      <FormFilters valuesFromParams={valuesFromParams} handleReset={handleReset} onSubmit={onSubmit} />
                    </Collapse.Panel>
                  </Collapse>
                </FormCollapseContainer>
              </Box>

              <Box p={3} pt={0}>
                {/* when filters are collapsed - show customer autocomplete at the top */}
                {isEmpty(activeKeys) && <CustomerAutoComplete />}

                <Box mt={3}>
                  <FormCtas
                    onSubmit={onSubmit}
                    handleReset={handleReset}
                    loadingCustomerJourney={isLoading}
                    cancelGetCustomerJourney={cancelFetchCustomerJourney}
                    handleRunLive={handleRunLive}
                    lastRetrievedAgo={lastRetrievedAgo}
                  />
                </Box>
              </Box>
              {showCustomerProfile && (
                <Box p={3}>
                  <CustomerProfile
                    customer={decodedCustomer}
                    shouldRefetch={refetchCustomerAttributes}
                    onRefetchSuccess={handleRefetchCustomerAttributesSuccess}
                  />
                </Box>
              )}
            </>
          </FixedSider>

          {/* Right Side */}
          <LayoutContent>
            <Header asVisual={as_visual} onChange={handleToggleTimelineVisualization} />

            {/* Content (timeline or visualization) */}
            <ContentContainer>
              {/* Timeline */}
              {!as_visual && (
                <div
                  ref={timelineRef as unknown as RefObject<HTMLDivElement>}
                  style={{ height: '100%', overflow: 'auto' }}
                >
                  <ActivityStream
                    customer={decodedCustomer}
                    error={customerJourneyError?.message}
                    loading={isLoading}
                    infiniteScrollLoading={isInfiniteLoading}
                    customerJourneyData={customerJourneyData}
                  />
                </div>
              )}

              {/* Visual Summary */}
              {as_visual && (
                <Box style={{ height: '100%', position: 'relative' }}>
                  {/* Don't wrap DynamicPlotHeightWrapper in Spin or it causes
                  some VERY weird re-render/layout issues
              */}
                  {isLoading && (
                    <Spin size="large" tip="Loading..." spinning={isLoading} style={{ width: '100%' }}>
                      <div style={{ minHeight: 400 }} />
                    </Spin>
                  )}

                  {!isLoading && !customerJourneyError && (
                    <DynamicPlotHeightWrapper
                      render={(updatedHeight) => (
                        <Box style={{ height: '100%' }}>
                          <DynamicPlot {...(customerJourneyData?.plot as DynamicPlotProps)} height={updatedHeight} />
                        </Box>
                      )}
                    />
                  )}
                </Box>
              )}
            </ContentContainer>
          </LayoutContent>
        </StyledContainer>
      </form>
    </FormProvider>
  )
}

export default Customer
