import { NetworkStatus } from '@apollo/client'
import { App, BackTop, Spin } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { DASHBOARD_BACKGROUND_COLOR } from 'components/Narratives/Dashboards/BuildDashboard/constants'
import { useAssembleNarrative } from 'components/Narratives/hooks'
import { GetFileAPIReturn, INarrativeFile } from 'components/Narratives/interfaces'
import ReassemblingNarrativeModal from 'components/Narratives/Modals/ReassemblingNarrativeModal'
import { CenteredLoader } from 'components/shared/icons/Loader'
import { Box, Typography } from 'components/shared/jawns'
import LargeScreenOnly from 'components/shared/LargeScreenOnly'
import { LayoutContent } from 'components/shared/layout/LayoutWithFixedSider'
import Page from 'components/shared/Page'
import {
  INarrative,
  INarrativeRunsUpdatesSubscription,
  INarrativeRunsUpdatesSubscriptionVariables,
  NarrativeRunsUpdatesDocument,
  useGetNarrativeBySlugQuery,
  useNarrativeRunsDateRangeQuery,
} from 'graph/generated'
import { find, findIndex, includes, isEmpty, isEqual, keys, last, map, omit, sortBy, truncate, uniqBy } from 'lodash'
import moment from 'moment'
import queryString from 'query-string'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { RouteComponentProps, useHistory } from 'react-router'
import styled from 'styled-components'
import { breakpoints, semiBoldWeight } from 'util/constants'
import { formatTimeStamp, formatTimeStampUtc, isMoreThanAWeekAgo, nDaysAgo, timeFromNow } from 'util/helpers'
import { makeFiles } from 'util/narratives'
import { ASSEMBLED_NARRATIVE_SUMMARY_WIDTH } from 'util/narratives/constants'
import { handleMavisErrorNotification, useLazyCallMavis } from 'util/useCallMavis'
import usePrevious from 'util/usePrevious'
import useToggle from 'util/useToggle'

import AnalysisContext from './AnalysisContext'
import AnalysisMain from './AnalysisMain'
import DashboardMain from './DashboardMain'
import DynamicFieldsDrawer from './DynamicFields/DynamicFieldsDrawer'
import DynamicFieldsLoadingModal from './DynamicFields/DynamicFieldsLoadingModal'
import NoAssembledNarrativeAlert from './NoAssembledNarrativeAlert'
import SnapshotDateRangeModal from './SnapshotDateRangeModal'
import useRecentlyViewed from './useRecentlyViewed'

interface IError {
  message: string
}

// since the whole page is scrollable you can't target
// the AnalysisContainer with BackTop
// force BackTop to left of SummaryBox
const StyledBackTop = styled(BackTop)`
  right: calc(${ASSEMBLED_NARRATIVE_SUMMARY_WIDTH}px + 96px);

  @media only screen and (max-width: ${breakpoints.md}) {
    display: none;
  }

  @media print {
    display: none;
  }
`

const formatDynamicFields = (dynamicFields: { [key: string]: string }): { name: string; value: string }[] =>
  map(keys(dynamicFields), (key) => ({
    name: key,
    value: dynamicFields[key],
  }))

const NarrativePage = ({ match }: RouteComponentProps<{ narrative_slug: string; dynamic_fields?: string }>) => {
  const { notification } = App.useApp()
  const history = useHistory()
  const company = useCompany()
  const { user } = useUser()

  const { narrative_slug, dynamic_fields } = match.params

  const isDashboard = useMemo(() => includes(history.location.pathname, '/dashboards/a/'), [history.location.pathname])

  const dynamicFields = useMemo(() => {
    if (!dynamic_fields) {
      return {}
    }

    try {
      // dynamic_fields are stored as base64 optional url param
      // this keeps customer info out of urls
      const decodedFields = atob(dynamic_fields)
      return JSON.parse(decodedFields)
    } catch (error) {
      // if there is a bad base64 dynamic_field param silently fail
      return {}
    }
  }, [dynamic_fields])

  const prevDynamicFields = usePrevious(dynamicFields)

  const [selectedFile, setSelectedFile] = useState<INarrativeFile | undefined>(undefined)
  const prevSelectedFile = usePrevious(selectedFile)

  // because fileOptions' labels use "time ago" logic
  // we re-render these options every minute to keep that "ago" current
  // (handled in useEffect below)
  const [fileOptions, setFileOptions] = useState<{ label: string; value: string }[]>([])

  const [fileResponse, setFileResponse] = useState<GetFileAPIReturn | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<IError | null>(null)
  const [forceRenderPlots, setForceRenderPlots] = useState(false)
  const [showDynamicFieldDrawer, toggleDynamicFieldDrawer] = useToggle(false)
  const [showDateRangeModal, toggleShowDateRange] = useToggle(false)
  const [applyingFilters, toggleApplyingFilters, setApplyingFilters] = useToggle(false)
  const [plotsLoaded, setPlotsLoaded] = useState<boolean[]>([])
  const [selectedSectionIndex, setSelectedSectionIndex] = useState<number>()
  const [assemblingLoaderVisible, setAssemblingLoaderVisible] = useState(false)
  const prevAssemblyLoaderVisible = usePrevious(assemblingLoaderVisible)

  const queryParams = queryString.parse(history.location.search)
  const snapshotParam =
    queryParams?.snapshot && Array.isArray(queryParams.snapshot)
      ? last(queryParams.snapshot)
      : (queryParams?.snapshot as string | null)

  const snapshotIsValid = queryParams?.snapshot && moment(snapshotParam).isValid()
  const fromDate = snapshotIsValid ? queryParams?.snapshot : nDaysAgo(30).format()

  const {
    data,
    loading: narrativeRunsLoading,
    refetch: refetchNarrativeRuns,
    networkStatus: narrativesRefetchingStatus,
    subscribeToMore,
  } = useNarrativeRunsDateRangeQuery({
    variables: { narrative_slug, company_id: company.id, from: fromDate, to: moment.utc().endOf('day').format() },
    notifyOnNetworkStatusChange: true,
  })

  const [loadNarrative, { loading: narativeLoading, error: narrativeError }] = useLazyCallMavis<any>({
    retryable: true,
    method: 'POST',
    path: '/v1/narrative/load',
  })

  // this is used for error text (if someone got a link to a non-assembled narrative) and narrative state in AnalysisView
  const { data: narrativeBySlug, refetch: refetchNarrative } = useGetNarrativeBySlugQuery({
    variables: { slug: narrative_slug, company_id: company.id, user_id: user.id },
  })

  const narrativesRefetching = narrativesRefetchingStatus === NetworkStatus.refetch
  const narrativeRunsLoadingOrRefetching = narrativeRunsLoading || narrativesRefetching

  const narrativeRuns = useMemo(
    () =>
      sortBy(
        uniqBy([...(data?.range || []), ...(data?.latest || [])], (item) => item.id),
        ['created_at']
      ).reverse(),
    [data]
  )

  const files: INarrativeFile[] = makeFiles(narrativeRuns)

  const formattedTimeStamp = formatTimeStampUtc(selectedFile?.name, company.timezone)
  const fileCreatedAt = selectedFile?.name

  const narrative = narrativeBySlug?.narrative[0]
  const datasets = fileResponse?.datasets

  const nameOrSlug = narrative?.name || narrative_slug

  const sections = fileResponse?.narrative?.sections
  const dashboardTabId = queryParams?.tab
  const selectedSection = find(sections, ['id', dashboardTabId])
  const pageTitle = `${nameOrSlug} ${
    selectedSection?.title ? `- ${selectedSection.title} - ` : ''
  } ${formattedTimeStamp}`

  const [assembleNarrative, { response: assembled, loading: assembling, error: errorAssembling }] =
    useAssembleNarrative()
  // if you quickly re-assemble a narrative it will come back with the same output key
  // this makes it hard to know if assemble was successful (can't check key change for success)
  // plug into useAssembleNarrative's onSuccess to accurately show/hide assembling modal
  const [assembleSuccess, setAssembleSuccess] = useState(false)
  const handleAssembleSuccess = () => {
    setAssembleSuccess(true)
  }

  const handleRunNarrative = () => {
    if (narrative) {
      assembleNarrative({ onSuccess: handleAssembleSuccess, narrative: narrative as INarrative })

      setAssemblingLoaderVisible(true)
    }
  }

  const handleCloseAssemblingLoader = () => {
    setAssemblingLoaderVisible(false)
    refetchNarrativeRuns()
    // setAssembleSuccess(false)
  }

  useRecentlyViewed(narrative?.id)

  // If submit apply filters was running - close modal when:
  // 1. narrative data is loaded
  // 2. there was an error loading narrative data
  useEffect(() => {
    if (!narativeLoading || narrativeError) {
      setApplyingFilters(false)
    }
  }, [narativeLoading, narrativeError, setApplyingFilters])

  // This is used to create subscription for newly added narrative runs
  useEffect(() => {
    let subscription: () => void | null
    if (!loading && subscribeToMore && narrativeRuns?.[0]?.created_at) {
      subscription = subscribeToMore<INarrativeRunsUpdatesSubscription, INarrativeRunsUpdatesSubscriptionVariables>({
        document: NarrativeRunsUpdatesDocument,
        variables: {
          company_id: company.id,
          narrative_slug: narrative_slug,
          from: narrativeRuns?.[0]?.created_at || moment.utc().startOf('day').format(),
        },
        updateQuery: (prev, { subscriptionData }) => {
          // when a new narrative run is created
          if (!isEmpty(subscriptionData.data.narrative_runs)) {
            const newRun = subscriptionData?.data?.narrative_runs?.[0]
            const newFile = makeFiles([newRun])?.[0]

            // make sure the file isn't a duplicate
            if (!isEmpty(newFile) && !isEqual(newFile?.name, files[0]?.name)) {
              // refetch narrative runs to rebuild files (update snapshot dropdown options)
              refetchNarrativeRuns()

              // if you are NOT on a snapshot
              // set newest file as selected (causes narrative to show newest run)
              const snapshotQueryParams = queryString.parse(history.location.search)?.snapshot
              if (isEmpty(snapshotQueryParams)) {
                setSelectedFile(newFile)
              }
            }
          }

          return prev
        },
      })
    }

    return () => {
      subscription?.()
    }
  }, [
    subscribeToMore,
    loading,
    narrativeRuns,
    company,
    narrative_slug,
    files,
    setSelectedFile,
    refetchNarrativeRuns,
    history.location.search,
  ])

  // set inital selectedFile with first narrative run (already sorted by created)
  useEffect(() => {
    if (!selectedFile && !isEmpty(files)) {
      if (!isEmpty(queryParams?.snapshot)) {
        const fileIndex = findIndex(files, ['name', queryParams.snapshot])
        if (fileIndex !== -1) {
          // set the file from query params
          setSelectedFile(files[fileIndex])

          // Fire notification telling the user they are on a snapshot (not most up-to-date)
          const snapshotTimestamp = formatTimeStamp(queryParams.snapshot, company.timezone, 'L')
          notification.info({
            key: 'narrative-snapshot-reminder-key',
            placement: 'topRight',
            message: `You are viewing a historical snapshot taken on ${snapshotTimestamp}`,
            // You can't change snapshots in mobile so don't tell them they can
            description: <LargeScreenOnly>You can change snapshots in the sidebar.</LargeScreenOnly>,
          })
        } else {
          // There was a snapshot query param - but the file doesn't exist
          // Set first file as default
          setSelectedFile(files[0])

          // Remove snapshot from query params
          const updatedParams = queryString.stringify(omit(queryParams, 'snapshot'))
          history.push({ search: `?${updatedParams}` })

          // Notify the user they tried to go to a snapshot that doesn't exist
          notification.info({
            key: 'snapshot-does-not-exist',
            placement: 'topRight',
            message: 'The snapshot from the url does not exist.',
            description: 'You are on the most current version of this narrative.',
          })
        }
      } else {
        setSelectedFile(files[0])
      }
    }
  }, [selectedFile, files, history, queryParams, notification, company.timezone])

  // make sure snapshot matches query params (or lack there of)
  // in case user goes back/forward
  useEffect(() => {
    const { snapshot } = queryParams

    // if there is a query param - make sure selected file matches
    if (snapshot && selectedFile?.name && !isEqual(selectedFile?.name, snapshot)) {
      // find the snapshot
      const fileIndex = findIndex(files, ['name', snapshot])
      if (fileIndex !== -1) setSelectedFile(files[fileIndex])

      return
    }

    // if there is no query param - make sure most recent file is selected
    if (!snapshot && selectedFile?.name && !isEqual(selectedFile?.name, files[0]?.name)) {
      setSelectedFile(files[0])
    }
  }, [queryParams, files, selectedFile, setSelectedFile])

  // Fetch chosen Narrative
  useEffect(() => {
    const fetchFile = async () => {
      try {
        setLoading(true)
        setError(null)

        if (selectedFile && !isEqual(prevSelectedFile, selectedFile)) {
          // mavis expects {name: string, value: string}[] for dynamic_fields
          // convert from {} => {}[]
          const formattedDynamicFields = formatDynamicFields(dynamicFields)

          const response = await loadNarrative({
            body: {
              snapshot: selectedFile.name,
              slug: narrative_slug,
              dynamic_fields: formattedDynamicFields,
            },
          })

          setFileResponse(response)
        }

        setLoading(false)
      } catch (error) {
        setLoading(false)
        setError(error as Error)
      }
    }

    if (selectedFile && !isEqual(prevSelectedFile, selectedFile)) {
      fetchFile()
    }
  }, [prevSelectedFile, selectedFile, narrative_slug, dynamicFields, loadNarrative])

  // refetch narrative if dynamic fields have changed (query params)
  useEffect(() => {
    const refetchNarrative = async () => {
      // mavis expects {name: string, value: string}[] for dynamic_fields
      // convert from {} => {}[]
      const formattedDynamicFields = formatDynamicFields(dynamicFields)

      const response = await loadNarrative({
        body: {
          snapshot: selectedFile?.name,
          slug: narrative_slug,
          dynamic_fields: formattedDynamicFields,
        },
      })

      setFileResponse(response)
    }

    // Refetch narratives if dynamic fields change
    if (!isEmpty(selectedFile) && !isEmpty(fileResponse) && !isEqual(prevDynamicFields, dynamicFields)) {
      refetchNarrative()
    }
  }, [fileResponse, prevDynamicFields, dynamicFields, selectedFile, loadNarrative, narrative_slug])

  // Keep selected fileOptions "updated ago" up-to-date
  useEffect(() => {
    const createFileOptions = () => {
      if (!isEmpty(files)) {
        const newFileOptions = map(files, (file) => {
          // only show the time if it's less than a week ago
          const showDate = isMoreThanAWeekAgo(file.name, company.timezone)
          const format = showDate ? 'MMM Do YYYY, h:mma z' : 'h:mma z'

          return {
            label: `${timeFromNow(file.name)} at (${formatTimeStampUtc(file.name, company.timezone, format)})`,
            value: file.name,
          }
        })
        setFileOptions(newFileOptions)
      }
    }

    // initialize fileOptions
    if (isEmpty(fileOptions) && !isEmpty(files)) {
      createFileOptions()
    }

    // update every mintue
    const createFileOptionsInterval = setInterval(createFileOptions, 1000 * 60)

    return () => {
      clearInterval(createFileOptionsInterval)
    }
  }, [files, fileOptions, company.timezone])

  // clear assemble success for next run
  useEffect(() => {
    if (prevAssemblyLoaderVisible && !assemblingLoaderVisible) {
      setAssembleSuccess(false)
    }
  }, [prevAssemblyLoaderVisible, assemblingLoaderVisible])

  // error notification for assembling
  useEffect(() => {
    if (errorAssembling) {
      handleMavisErrorNotification({ error: errorAssembling, notification })
    }
  }, [errorAssembling, notification])

  // success notification for assembling
  useEffect(() => {
    if (assembled) {
      notification.success({
        key: `assemble-narrative-success-${narrative?.slug}`,
        placement: 'topRight',
        message: (
          <Typography type="title400">
            <span style={{ fontWeight: 'bold' }}>{narrative?.name}</span> was successfully assembled
          </Typography>
        ),
      })
    }
  }, [assembled, narrative, notification])

  const onSelectSnapshot = useCallback(
    //  takes files arg b/c this is also used by SnapshotDateRangeModal
    // and SDRM may include files outside of initial range
    (val: string, files: INarrativeFile[]) => {
      const newFile = find(files, ['name', val])

      if (newFile) {
        // if not the first file, set its name to query params
        const updatedParams = isEqual(newFile.name, files[0].name)
          ? queryString.stringify(omit(queryParams, 'snapshot'))
          : queryString.stringify({
              ...queryParams,
              snapshot: newFile.name,
            })

        history.push({
          search: `?${updatedParams}`,
        })

        setSelectedFile(newFile)
      }
    },
    [history, queryParams]
  )

  if (error) {
    return (
      <Page
        title={`${isDashboard ? 'Dashboard' : 'Narrative'} error`}
        breadcrumbs={[{ url: '/narratives', text: 'Narratives' }]}
      >
        <Box p="24px">
          <Typography type="title400" color="red500" fontWeight={semiBoldWeight} mb="24px">
            {error?.message}
          </Typography>
        </Box>
      </Page>
    )
  }

  const noNarrativeFound =
    narrativeBySlug?.narrative && !narrativeRunsLoadingOrRefetching && !narativeLoading && isEmpty(fileResponse)

  const noQuestionsGoalsRecsTakeaways =
    isEmpty(fileResponse?.narrative?.question) &&
    isEmpty(fileResponse?.narrative?.goal) &&
    isEmpty(fileResponse?.narrative?.recommendation) &&
    isEmpty(fileResponse?.narrative?.key_takeaways)

  return (
    <Page
      title={pageTitle}
      bg={isDashboard && !noNarrativeFound ? DASHBOARD_BACKGROUND_COLOR : 'white'}
      hideChat
      mobileFriendly
      breadcrumbs={[{ url: '/narratives', text: 'Narratives' }, { text: truncate(nameOrSlug, { length: 24 }) }]}
    >
      {assemblingLoaderVisible && (
        <ReassemblingNarrativeModal
          onClose={handleCloseAssemblingLoader}
          success={assembleSuccess}
          loading={assembling}
          error={errorAssembling}
          isDashboard={isDashboard}
        />
      )}

      {loading && <CenteredLoader />}

      {!isEmpty(fileResponse) && (
        <AnalysisContext.Provider
          value={{
            analysisData: fileResponse,
            noQuestionsGoalsRecsTakeaways,
            datasetFiles: datasets,
            selectedDynamicFields: dynamicFields,
            narrative: narrative as INarrative,
            fileCreatedAt,
            timezone: company.timezone,
            forceRenderPlots,
            setForceRenderPlots,
            plotsLoaded,
            setPlotsLoaded,
            selectedSectionIndex,
            setSelectedSectionIndex,
            fileOptions,
            files,
            selectedFile,
            onSelectSnapshot,
            toggleShowDateRange,
            showDateRangeModal,
          }}
        >
          {selectedFile && fileResponse && narrative && (
            <LayoutContent
              style={{
                width: '100%',
                maxWidth: '100%',
                // don't set height or will break sticky in StyledSummaryBox
                minHeight: isDashboard ? '100vh' : 'inherit',
                padding: 0,
                backgroundColor: isDashboard ? DASHBOARD_BACKGROUND_COLOR : 'inherit',
              }}
            >
              <Spin spinning={narativeLoading}>
                <StyledBackTop target={() => document.getElementById('layoutMain') || window} />

                <DynamicFieldsLoadingModal isOpen={applyingFilters} onClose={toggleApplyingFilters} />
                <DynamicFieldsDrawer
                  isOpen={showDynamicFieldDrawer}
                  onClose={toggleDynamicFieldDrawer}
                  onSubmit={toggleApplyingFilters}
                />

                {isDashboard ? (
                  <DashboardMain
                    narrative={narrative as INarrative}
                    narrativeBySlug={narrativeBySlug}
                    fileResponse={fileResponse}
                    toggleDynamicFieldDrawer={toggleDynamicFieldDrawer}
                    handleRunNarrative={handleRunNarrative}
                    refetchNarrative={refetchNarrative}
                  />
                ) : (
                  <AnalysisMain
                    narrative={narrative as INarrative}
                    fileResponse={fileResponse}
                    toggleDynamicFieldDrawer={toggleDynamicFieldDrawer}
                    handleRunNarrative={handleRunNarrative}
                    refetchNarrative={refetchNarrative}
                    setSelectedSectionIndex={setSelectedSectionIndex}
                    selectedFile={selectedFile}
                  />
                )}
              </Spin>
            </LayoutContent>
          )}

          {showDateRangeModal && <SnapshotDateRangeModal />}
        </AnalysisContext.Provider>
      )}

      {noNarrativeFound && (
        <NoAssembledNarrativeAlert handleRunNarrative={handleRunNarrative} isDashboard={isDashboard} />
      )}
    </Page>
  )
}

export default NarrativePage
