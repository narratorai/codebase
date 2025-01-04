import {
  AreaChartOutlined,
  CaretRightOutlined,
  LoadingOutlined,
  NumberOutlined,
  TableOutlined,
} from '@ant-design/icons'
import { Button, ConfigProvider, Empty, Modal, Select, Spin } from 'antd-next'
import { Divider, FormItem, SearchSelect } from 'components/antd/staged'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { TimeSegmentationSelect } from 'components/Datasets/BuildDataset/tools/shared/ReactHookForm'
import TimeRangeFilter from 'components/Datasets/BuildDataset/tools/shared/ReactHookForm/TimeRangeFilter/TimeRangeFilter'
import ColumnFilters from 'components/Datasets/Explore/ColumnFilters'
import ExploreDatasetDefintion from 'components/Datasets/Explore/ExploreDatasetDefinition'
import { Box, Flex, Typography } from 'components/shared/jawns'
import ProgressLoader from 'components/shared/ProgressLoader'
import ShareCopyButton from 'components/shared/ShareCopyButton'
import { useGetDatasetBySlugQuery } from 'graph/generated'
import { compact, find, isEmpty, map, startCase } from 'lodash'
import queryString from 'query-string'
import { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { generatePath, RouteComponentProps, useHistory } from 'react-router'
import styled from 'styled-components'
import { semiBoldWeight } from 'util/constants'
import { TIME_FILTER_KIND_BEGINNING, TIME_FILTER_KIND_NOW } from 'util/datasets'
import { required } from 'util/forms'
import { useLazyCallMavis } from 'util/useCallMavis'
import usePrevious from 'util/usePrevious'

import ExploreDatasetCtas from './EploreDatasetCtas'
import ExploreDatasetOutput from './ExploreDatasetOutput'
import { ApplyFiltersResponse, DatasetExploreFormValue, DatasetExploreOptions } from './interfaces'

const OUTPUT_KIND_OPTIONS = [
  {
    label: (
      <Flex>
        <Box mr={1}>
          <AreaChartOutlined />
        </Box>{' '}
        Plot
      </Flex>
    ),
    value: 'plot',
  },
  {
    label: (
      <Flex>
        <Box mr={1}>
          <TableOutlined />
        </Box>{' '}
        Table
      </Flex>
    ),
    value: 'table',
  },
  {
    label: (
      <Flex>
        <Box mr={1}>
          <NumberOutlined />
        </Box>{' '}
        Metric
      </Flex>
    ),
    value: 'metric',
  },
]

const StyledModal = styled(Modal)`
  top: 5%;

  .antd5-modal-content {
    overflow-y: auto;
    height: 90vh;
  }
`

const ExploreDatasetModal: FC<RouteComponentProps<{ datasetSlug: string; linkSlug?: string }>> = ({ match }) => {
  // linkSlug is how users can share their explores
  const { datasetSlug, linkSlug } = match.params
  const isNewExplore = datasetSlug === 'new'

  const history = useHistory()
  const company = useCompany()
  const { user } = useUser()

  // plotSlug and groupSlug query params passed by plots in narratives
  const queryParams = new URLSearchParams(history.location.search)
  const plotSlug = queryParams.get('plotSlug')
  const groupSlug = queryParams.get('groupSlug')
  const previousUrl = queryParams.get('previousUrl')
  const narrativeSlug = queryParams.get('narrativeSlug')
  const uploadKey = queryParams.get('uploadKey')

  // cohort activity id is used when explore isn't pointing to a dataset
  // but pointing to an activity instead (which will be set as cohort activity)
  const cohortActivityId = queryParams.get('cohortActivity')

  const { data } = useGetDatasetBySlugQuery({
    variables: {
      company_id: company.id,
      slug: datasetSlug as string,
      user_id: user.id,
    },
    skip: !datasetSlug || isNewExplore,
  })

  const datasetName = data?.dataset?.[0]?.name

  const onClose = useCallback(() => {
    // check if a previous url was included in the query params
    // if so - redirect to that url (helps maintain previous query params)
    if (previousUrl) {
      const parsedUrl = queryString.parseUrl(previousUrl)
      const pathname = parsedUrl.url.split(window.location.origin)[1]
      const search = queryString.stringify(parsedUrl.query)

      return history.push({
        pathname,
        search,
      })
    }

    // otherwise, redirect to url before /explorer
    const { url } = match
    const exploreIndex = url.indexOf('/explorer')
    const newUrl = url.slice(0, exploreIndex)

    history.push(newUrl)
  }, [history, match.url, previousUrl, company.slug])

  const [hasUpdatedOutputKind, setHasUpdatedOutputKind] = useState<boolean>()
  const [hasUpdatedPlotKind, setHasUpdatedPlotKind] = useState<boolean>()
  const [sharedLink, setSharedLink] = useState<string>()

  // getOptions should only fire in 2 ways:
  // 1) when opening the modal - and not shared link present
  // 2) when updating the dataset definition ("Update Options")
  // It gives us initial values and options for metrics/filters
  const [getOptions, { response: exploreOptions, loading: loadingExploreOptions, error: exploreOptionsError }] =
    useLazyCallMavis<DatasetExploreOptions>({
      method: 'POST',
      path: '/v1/dataset/explore/get_explore_options',
      retryable: true,
    })
  const prevLoadingExploreOptions = usePrevious(loadingExploreOptions)
  const getExploreOptionsSuccessful = !!(
    prevLoadingExploreOptions &&
    !loadingExploreOptions &&
    !isEmpty(exploreOptions) &&
    !exploreOptionsError
  )

  // getSharedLink should only fire in 1 way
  // 1) if a link slug is present in the url
  // gives us the same response as getOptions (but has been saved)
  const [getSharedLink, { response: sharedLinkOptions, loading: getSharedLinkLoading, error: getSharedLinkError }] =
    useLazyCallMavis<DatasetExploreOptions>({
      method: 'GET',
      path: '/v1/dataset/explore/load_share_explore',
      retryable: true,
    })
  const prevGetSharedLinkLoading = usePrevious(getSharedLinkLoading)
  const getSharedLinkSuccessful = !!(
    prevGetSharedLinkLoading &&
    !getSharedLinkLoading &&
    !isEmpty(sharedLinkOptions) &&
    !getSharedLinkError
  )

  // if linkSlug is present in url fetch the explore based on link
  useEffect(() => {
    if (linkSlug && !getSharedLinkLoading && !getSharedLinkError && isEmpty(sharedLinkOptions)) {
      getSharedLink({ params: { cache_id: linkSlug } })
    }
  }, [linkSlug, getSharedLinkLoading, getSharedLinkError, sharedLinkOptions])

  // We can either get values from getOptions or getSharedLink
  // Theoretically someone can call getOptions multiple times
  // So default to getOptions response over getSharedLink
  const valuesFromMavis = useMemo(() => {
    return !isEmpty(exploreOptions) ? exploreOptions : sharedLinkOptions
  }, [exploreOptions, sharedLinkOptions])

  // applyFilters fires in 2 ways:
  // 1) when getOptions returns and we fetch the output (happens once)
  // 2) user hits the "Update Output" button
  const [
    applyFilters,
    {
      response: applyFiltersResponse,
      loading: loadingApplyFilters,
      error: applyFiltersError,
      cancel: cancelApplyFilters,
    },
  ] = useLazyCallMavis<ApplyFiltersResponse>({
    method: 'POST',
    path: '/v1/dataset/explore/apply_explore',
    retryable: true,
  })

  // using this simplified interface (using primitive types) of DatasetExploreOptions
  // b/c react-hook-form typescript checking
  // is struggling with non-primitive types in the DOM's form
  // https://github.com/react-hook-form/react-hook-form/issues/4704#issuecomment-816568677
  const methods = useForm<DatasetExploreFormValue>({
    defaultValues: {
      time_filter: {
        from_type: TIME_FILTER_KIND_BEGINNING,
        to_type: TIME_FILTER_KIND_NOW,
      },
      dataset_config: {
        slug: datasetSlug,
        group_slug: groupSlug || null,
        plot_slug: plotSlug || null,
      },
      selected_filters: [],
      segment_bys: [],
      y_metrics: [],
      time_resolution: null,
      plot_kind: '',
      plot_options: [],
      output_kind: '',
    },
    mode: 'all',
  })

  const { handleSubmit, reset, watch, setValue, control, formState } = methods
  const { errors, isValid, isDirty } = formState

  const formValues = watch()

  const fetchExploreOptions = useCallback(() => {
    const formDatasetConfig = formValues?.dataset_config || {}

    // mavis is expecting cohort as "null"
    // if values outside of defaults don't exist
    const cohortValues = formValues?.cohort
    const hasValidCohortValues = !isEmpty(cohortValues?.activity_ids) && !isEmpty(cohortValues?.occurrence_filter)
    const cohort = hasValidCohortValues ? cohortValues : null

    getOptions({
      body: {
        dataset_config: {
          ...formDatasetConfig,
          slug: isNewExplore ? null : datasetSlug || null,
          group_slug: groupSlug || null,
          plot_slug: plotSlug || null,
          activity_id: cohortActivityId || null,
          narrative_slug: narrativeSlug || null,
          upload_key: uploadKey || null,
        },
        cohort,
        append_activities: formValues?.append_activities || null,
        activity_stream: formValues?.activity_stream || null,
      },
    })
  }, [
    getOptions,
    datasetSlug,
    isNewExplore,
    cohortActivityId,
    plotSlug,
    groupSlug,
    formValues?.cohort,
    formValues?.append_activities,
    formValues?.dataset_config,
    formValues?.activity_stream,
    narrativeSlug,
    uploadKey,
  ])

  // This is how you create a link to share the explore
  // will return a slug, that can be used to fetch the saved explore
  const [createShareableLink, { response: createShareableLinkResponse, loading: creatingShareableLink }] =
    useLazyCallMavis<{ slug: string }>({
      method: 'POST',
      path: '/v1/dataset/explore/get_share_explore',
      retryable: true,
    })

  const handleCreateShareableLink = useCallback(() => {
    const body = {
      ...formValues,
      // mavis expects null - not undefined
      time_resolution: formValues.time_resolution || null,
      // Mavis tries to make intelligent descisions about which output kind should be selected
      // Unless the user changes the output kind - send null in when "Update Output"
      output_kind: hasUpdatedOutputKind ? formValues.output_kind : null,
      plot_kind: hasUpdatedPlotKind ? formValues.plot_kind : null,
    }

    setSharedLink('')

    createShareableLink({ body })
  }, [formValues, createShareableLink])

  // create new link from create link response
  useEffect(() => {
    if (createShareableLinkResponse?.slug && isEmpty(sharedLink)) {
      const newPath = generatePath(match.path, {
        ...match.params,
        linkSlug: createShareableLinkResponse.slug,
      })

      const newLink = `${window.location.origin}${newPath}`

      setSharedLink(newLink)
    }
  }, [sharedLink, match.path, linkSlug])

  // get explore options when there is a dataset provided (i.e. Dataset Index Item)
  // AND there isn't a shareable link provided
  const noExploreOptions = isEmpty(exploreOptions)
  const noExploreError = isEmpty(exploreOptionsError)
  useEffect(() => {
    if (datasetSlug && noExploreOptions && noExploreError && !loadingExploreOptions && !linkSlug) {
      fetchExploreOptions()
    }
  }, [datasetSlug, noExploreOptions, noExploreError, loadingExploreOptions, linkSlug])

  // when fired - it updates the content at the bottom (plot, table, metric)
  const handleUpdateOutput = useCallback(
    (formValue: DatasetExploreFormValue) => {
      const body = {
        ...formValue,
        // mavis expects null - not undefined
        time_resolution: formValue.time_resolution || null,
        // Mavis tries to make intelligent descisions about which output kind should be selected
        // Unless the user changes the output kind - send null in when "Update Output"
        output_kind: hasUpdatedOutputKind ? formValue.output_kind : null,
        plot_kind: hasUpdatedPlotKind ? formValue.plot_kind : null,
      }

      // apply the filters
      applyFilters({ body })

      // reset form state to establish new "isDirty" baseline
      reset(formValue)
    },
    [applyFilters, reset, hasUpdatedOutputKind, hasUpdatedPlotKind]
  )

  // set output_kind from 'apply response'
  useEffect(() => {
    if (applyFiltersResponse?.output_kind) {
      setValue('output_kind', applyFiltersResponse?.output_kind, { shouldValidate: true })
    }
  }, [setValue, applyFiltersResponse?.output_kind])

  const onSubmit = handleSubmit((formValue: DatasetExploreFormValue) => {
    handleUpdateOutput(formValue)
  })

  // Happens every time options/presets are returned successfully
  // (either from normal getOptions or from shared link)
  // set selected filters from get options response or from url state
  useEffect(() => {
    if (getExploreOptionsSuccessful || getSharedLinkSuccessful) {
      // order of maintaining state (formValues > valuesFromMavis)
      // 1) formValues (if present - dont' override)
      // 2) explore options (if present - can be called in multiple ways)
      // 3) shared link (if present - can only be called when loading the page from link)

      const newFormState = {
        ...valuesFromMavis, // has dataset_config - which needs to be sent in both get_explore_options and apply_explore
        // until we have a machine handle the non-dataset-definition logic
        // check if formValues are empty for below fields (defaults will be empty)
        // NOTE: any time we add fields to mavis responses - we need to add them here!
        segment_bys: !isEmpty(formValues.segment_bys) ? formValues.segment_bys : valuesFromMavis?.segment_bys,
        selected_filters: !isEmpty(formValues.selected_filters)
          ? formValues.selected_filters
          : valuesFromMavis?.selected_filters,
        time_resolution: !isEmpty(formValues.time_resolution)
          ? formValues.time_resolution
          : valuesFromMavis?.time_resolution,
        y_metrics: !isEmpty(formValues.y_metrics) ? formValues.y_metrics : valuesFromMavis?.y_metrics,
        plot_kind: !isEmpty(formValues.plot_kind) ? formValues.plot_kind : valuesFromMavis?.plot_kind,
        plot_options: !isEmpty(formValues.plot_options) ? formValues.plot_options : valuesFromMavis?.plot_options,
        output_kind: !isEmpty(formValues.output_kind) ? formValues.output_kind : valuesFromMavis?.output_kind,
        time_filter: !isEmpty(formValues?.time_filter) ? formValues.time_filter : valuesFromMavis?.time_filter,
      }

      // get new output (and reset form state)
      handleUpdateOutput(newFormState as DatasetExploreFormValue)
    }
  }, [getExploreOptionsSuccessful, getSharedLinkSuccessful, formValues, valuesFromMavis, handleUpdateOutput])

  const yMetricOptions = useMemo(() => {
    if (!isEmpty(valuesFromMavis?.y_metric_options)) {
      return map(valuesFromMavis?.y_metric_options, (op) => ({
        value: op.id,
        label: op.label,
        optGroupBy: op.opt_group,
        allValues: op,
      }))
    }

    return []
  }, [valuesFromMavis?.y_metric_options])

  // find value in yMetricOptions
  // and save the whole object to form state
  const handleYMetricOnChange = useCallback(
    (values: string[]) => {
      const foundOptionValues = compact(
        map(values, (val) => {
          const foundOption = find(yMetricOptions, ['value', val])

          if (foundOption) {
            return foundOption.allValues
          }

          return undefined
        })
      )

      setValue('y_metrics', foundOptionValues, { shouldValidate: true })
    },
    [yMetricOptions, setValue]
  )

  const selectedYMetrics = formValues?.y_metrics
  const formattedYMetricValues = useMemo(() => {
    return map(selectedYMetrics, (selectedMetric) => selectedMetric.id)
  }, [selectedYMetrics])

  const segmentByOptions = useMemo(() => {
    if (!isEmpty(valuesFromMavis?.segment_by_options)) {
      return map(valuesFromMavis?.segment_by_options, (op) => ({
        value: op.id,
        label: op.label,
        optGroupBy: op.opt_group,
        allValues: op,
      }))
    }

    return []
  }, [valuesFromMavis?.segment_by_options])

  // find value in segmentByOptions
  // and save the whole object to form state
  const handleSegmentBysOnChange = useCallback(
    (values: string[]) => {
      const foundOptionValues = compact(
        map(values, (val) => {
          const foundOption = find(segmentByOptions, ['value', val])
          if (foundOption) {
            return foundOption.allValues
          }

          return undefined
        })
      )

      setValue('segment_bys', [...foundOptionValues], { shouldValidate: true })
    },
    [segmentByOptions, setValue]
  )

  const selectedSegmentBys = formValues?.segment_bys
  const formattedSegmentByValues = useMemo(() => {
    return map(selectedSegmentBys, (selectedSegment) => selectedSegment.id)
  }, [selectedSegmentBys])

  const handleRenderEmpty = useCallback(() => {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data" />
  }, [])

  const plotKindOptions = useMemo(() => {
    return map(formValues?.plot_options, (op) => ({ label: startCase(op), value: op }))
  }, [formValues?.plot_options])

  const outputKindOnChange = useCallback(
    (kind: string) => {
      setValue('output_kind', kind, { shouldValidate: true })
      setHasUpdatedOutputKind(true)
    },
    [setValue]
  )

  const plotKindOnChange = useCallback(
    (kind: string) => {
      setValue('plot_kind', kind, { shouldValidate: true })
      setHasUpdatedPlotKind(true)
    },
    [setValue]
  )

  return (
    <StyledModal
      open
      title={
        <Flex alignItems="center">
          <Typography type="title400" mr={2}>
            Explore Dataset - {datasetName || startCase(datasetSlug)}
          </Typography>{' '}
          <ShareCopyButton
            createLink={handleCreateShareableLink}
            shareableLink={sharedLink}
            loading={creatingShareableLink}
          />
        </Flex>
      }
      footer={null}
      onCancel={onClose}
      width="95vw"
      destroyOnClose
    >
      <ConfigProvider renderEmpty={handleRenderEmpty}>
        <FormProvider {...methods}>
          <form onSubmit={onSubmit}>
            <Box pb={4}>
              <Box pb={1}>
                <ExploreDatasetDefintion
                  fetchExploreOptions={fetchExploreOptions}
                  loadingExploreOptions={loadingExploreOptions}
                  getExploreOptionsSuccessful={getExploreOptionsSuccessful || getSharedLinkSuccessful}
                  exploreOptions={valuesFromMavis}
                  datasetSlug={datasetSlug}
                />
              </Box>

              <Box pb={3}>
                <Spin spinning={loadingExploreOptions || getSharedLinkLoading}>
                  <Flex alignItems="end" flexWrap="wrap" style={{ width: 'fit-content' }}>
                    <Box mt={1} mr={1}>
                      <Controller
                        control={control}
                        name="y_metrics"
                        rules={{ validate: required }}
                        render={({ field, fieldState: { isTouched, error } }) => (
                          <FormItem
                            required
                            label="Measures"
                            meta={{ touched: isTouched, error: error?.message }}
                            layout="vertical"
                            style={{ marginBottom: 0 }}
                          >
                            <SearchSelect
                              {...field}
                              style={{ width: 256 }}
                              placeholder="Measures"
                              mode="multiple"
                              isGrouped
                              options={yMetricOptions}
                              onChange={handleYMetricOnChange}
                              value={formattedYMetricValues}
                              popupMatchSelectWidth={false}
                              allowClear
                            />
                          </FormItem>
                        )}
                      />
                    </Box>

                    <Box mt={1} mr={1}>
                      <Controller
                        control={control}
                        name="segment_bys"
                        render={({ field, fieldState: { isTouched, error } }) => (
                          <FormItem
                            label="Segment By"
                            meta={{ touched: isTouched, error: error?.message }}
                            layout="vertical"
                            style={{ marginBottom: 0 }}
                          >
                            <SearchSelect
                              {...field}
                              style={{ width: 256 }}
                              placeholder="Segment By"
                              mode="multiple"
                              isGrouped
                              options={segmentByOptions}
                              onChange={handleSegmentBysOnChange}
                              value={formattedSegmentByValues}
                              popupMatchSelectWidth={false}
                              allowClear
                            />
                          </FormItem>
                        )}
                      />
                    </Box>

                    <Flex mt={1} mr={1}>
                      <TimeRangeFilter filterFieldName="time_filter" hideValueKinds />
                    </Flex>

                    <Box mt={1}>
                      <Typography mr={1} as="span" fontWeight={semiBoldWeight}>
                        By
                      </Typography>
                      <TimeSegmentationSelect
                        fieldName="time_resolution"
                        useSimpleOptions
                        allowClear
                        isRequired={false}
                      />
                    </Box>
                  </Flex>

                  <Box mt={1}>
                    <ColumnFilters
                      fieldName="selected_filters"
                      column_options={exploreOptions?.filter_column_options || []}
                      visible
                    />
                  </Box>
                </Spin>
              </Box>

              <Divider />

              <Flex justifyContent="space-between" pb={2}>
                <Flex alignItems="center">
                  <Box mr={1}>
                    <Controller
                      control={control}
                      name="output_kind"
                      render={({ field }) => (
                        <Select
                          {...field}
                          onChange={outputKindOnChange}
                          size="small"
                          placeholder="Output Kind"
                          options={OUTPUT_KIND_OPTIONS}
                          popupMatchSelectWidth={false}
                        />
                      )}
                    />
                  </Box>

                  {formValues?.output_kind === 'plot' && (
                    <Controller
                      control={control}
                      name="plot_kind"
                      shouldUnregister
                      render={({ field }) => (
                        <Select
                          {...field}
                          onChange={plotKindOnChange}
                          size="small"
                          placeholder="Plot Kind"
                          options={plotKindOptions}
                          popupMatchSelectWidth={false}
                        />
                      )}
                    />
                  )}
                </Flex>

                <Flex mr={8} alignItems="center">
                  <Box mr={1}>
                    <Button
                      onClick={loadingApplyFilters ? cancelApplyFilters : onSubmit}
                      danger={loadingApplyFilters}
                      disabled={!isValid || !isEmpty(errors)}
                      type="primary"
                      icon={loadingApplyFilters ? <LoadingOutlined /> : <CaretRightOutlined />}
                    >
                      {loadingApplyFilters ? 'Cancel Run' : 'Run'}
                    </Button>
                  </Box>

                  <ExploreDatasetCtas applyFiltersResponse={applyFiltersResponse} isDirty={isDirty} />
                </Flex>
              </Flex>

              {(loadingApplyFilters || applyFiltersError || exploreOptionsError) && (
                <ProgressLoader
                  error={applyFiltersError || exploreOptionsError}
                  loading={loadingApplyFilters}
                  success={false}
                  loadingBar={valuesFromMavis?.loading_screen}
                />
              )}

              {!loadingApplyFilters && !applyFiltersError && applyFiltersResponse && (
                <Box>
                  <ExploreDatasetOutput
                    {...applyFiltersResponse}
                    outputKind={formValues?.output_kind}
                    datasetSlug={datasetSlug}
                  />
                </Box>
              )}
            </Box>
          </form>
        </FormProvider>
      </ConfigProvider>
    </StyledModal>
  )
}

export default ExploreDatasetModal
