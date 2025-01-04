import { InfoCircleOutlined } from '@ant-design/icons'
import { Checkbox, Collapse, Input, Spin } from 'antd-next'
import { CheckboxChangeEvent } from 'antd-next/es/checkbox'
import { Divider, FormItem, SearchSelect } from 'components/antd/staged'
import DatasetSearchBar from 'components/Datasets/DatasetSearchBar'
import { useBuildNarrativeContext } from 'components/Narratives/BuildNarrative/BuildNarrativeProvider'
import AssembledContentContainer from 'components/Narratives/BuildNarrative/Sections/BasicContent/AssembledContentContainer'
import * as SharedLayout from 'components/Narratives/BuildNarrative/Sections/SharedLayout'
import { useCompileContent } from 'components/Narratives/hooks'
import MetricGraphic from 'components/Narratives/Narrative/ContentWidget/MetricGraphic'
import { Box, Flex, Typography } from 'components/shared/jawns'
import SimpleColorPicker from 'components/shared/SimpleColorPicker'
import { filter, find, isBoolean, isEmpty, isString, map } from 'lodash'
import { MutableRefObject, useCallback, useEffect, useMemo, useState } from 'react'
import { useField, useForm } from 'react-final-form'
import { colors } from 'util/constants'
import { CONTENT_TYPE_METRIC_V2 } from 'util/narratives'
import { makeMetricCopiedContent } from 'util/shared_content/helpers'
import { useLazyCallMavis } from 'util/useCallMavis'

import CompileRefreshCtas from './CompileRefreshCtas'
import { GroupResponse } from './interfaces'

////////////////////////////
// Needs company's datasets
// then company's groups
// then group's metrics
////////////////////////////

const DATASET_SLUG_FIELDNAME = 'data.dataset_slug'
const GROUP_FIELDNAME = 'data.group_slug'
const METRIC_FIELDNAME = 'data.column_id'
const METRIC_RENAME_FIELDNAME = 'data.name'
const METRIC_DESCRIPTION_FIELDNAME = 'data.description'
const FILTER_FIELDNAME = 'data.filter_label'
const FILTER_DATA = 'data.filters'

const SHOW_VALUES_IN_PLOT = 'data.show_values_in_plot'
const PLOT_COLOR = 'data.plot_color'

const ADD_COMPARISON = 'data.add_comparison'
const COMPARISON_FILTER_FIELDNAME = 'data.comparison_filter_label'
const COMPARISON_FILTER_DATA = 'data.compare_filters'
const MAKE_PERCENT_CHANGE = 'data.make_percent_change'
const COMPARE_TEXT = 'data.compare_text'

interface MetricResponse {
  all_metrics: {
    id: string
    label: string
  }[]
  // use these in compile
  metric_options?: {
    label: string
    filters: {
      column_id: string
      display: string
      label: string
    }
  }[]
}

interface Props {
  fieldName: string
  setCompileDisabled: (disabled: boolean) => void
  refreshInputOptionsRef: MutableRefObject<(() => void) | undefined>
  compileContentRef: MutableRefObject<(() => void) | undefined>
  showRecompileAndRefreshButtons?: boolean
}

const MetricContent = ({
  fieldName,
  setCompileDisabled,
  refreshInputOptionsRef,
  compileContentRef,
  showRecompileAndRefreshButtons = false,
}: Props) => {
  const { batch } = useForm()

  const {
    assembledFieldsResponse,
    availableDatasets: datasets,
    availableDatasetsLoading: datasetsLoading,
    refetchDatasets,
  } = useBuildNarrativeContext()
  const fields = assembledFieldsResponse?.fields

  // don't override group/metric on page load
  // set this to true on first update
  const [hasSetInitialValues, setHasSetInitialValues] = useState(false)

  const {
    input: { value: datasetSlug, onChange: onChangeSelectedDatasetSlug, meta: datasetMeta },
  } = useField(`${fieldName}.${DATASET_SLUG_FIELDNAME}`, { subscription: { value: true } })

  // get all Dataset's Groups
  const [getGroups, { response: groups, loading: groupsLoading }] = useLazyCallMavis<GroupResponse[]>({
    method: 'GET',
    path: `/v1/narrative/content/get_dataset_groups`,
    // pass dataset slug in callback, b/c form state
    // isn't defined here, at the time it's called below (and we need it!)
  })

  // get all Group's Metrics
  const [getMetrics, { response: metrics, loading: metricsLoading }] = useLazyCallMavis<MetricResponse>({
    method: 'POST',
    path: '/v1/narrative/content/get_metric_options',
    // pass dataset/group slug in callback, b/c form state
    // isn't defined here, at the time it's called below (and we need it!)
  })

  const {
    input: { value: selectedGroup, onChange: onChangeSelectedGroup, meta: groupMeta },
  } = useField(`${fieldName}.${GROUP_FIELDNAME}`, { subscription: { value: true } })

  const {
    input: { value: selectedMetric, onChange: onChangeSelectedMetric, meta: metricMeta },
  } = useField(`${fieldName}.${METRIC_FIELDNAME}`, { subscription: { value: true } })

  const {
    input: { value: selectedFilter, onChange: onChangeSelectedFilter, meta: filterMeta },
  } = useField(`${fieldName}.${FILTER_FIELDNAME}`, { subscription: { value: true } })

  const {
    input: { value: selectedFilterData, onChange: onChangeSelectedFilterData },
  } = useField(`${fieldName}.${FILTER_DATA}`, { subscription: { value: true } })

  const { input: renameInput } = useField(`${fieldName}.${METRIC_RENAME_FIELDNAME}`, { subscription: { value: true } })
  const { input: descriptionInput } = useField(`${fieldName}.${METRIC_DESCRIPTION_FIELDNAME}`, {
    subscription: { value: true },
  })

  const { input: addComparisonInput } = useField(`${fieldName}.${ADD_COMPARISON}`, {
    subscription: { value: true },
  })

  const { input: makePercentChangeInput } = useField(`${fieldName}.${MAKE_PERCENT_CHANGE}`, {
    subscription: { value: true },
  })

  const { input: compareTextInput } = useField(`${fieldName}.${COMPARE_TEXT}`, {
    subscription: { value: true },
  })

  const {
    input: { value: selectedComparisonFilter, onChange: onChangeSelectedComparisonFilter },
  } = useField(`${fieldName}.${COMPARISON_FILTER_FIELDNAME}`, {
    subscription: { value: true },
  })

  const {
    input: { value: selectedComparisonFilterData, onChange: onChangeSelectedComparisonFilterData },
  } = useField(`${fieldName}.${COMPARISON_FILTER_DATA}`, { subscription: { value: true } })

  const handleOnChangeAddComparison = useCallback(
    (e: CheckboxChangeEvent) => {
      const checked = e.target.checked
      addComparisonInput.onChange(checked)

      // set default for comparison if checking
      if (checked) {
        compareTextInput.onChange('Change')
        makePercentChangeInput?.onChange(true)
      }

      // return to falsey values when unchecking
      if (!checked) {
        compareTextInput.onChange(undefined)
        makePercentChangeInput?.onChange(false)
        onChangeSelectedComparisonFilterData(undefined)
        onChangeSelectedComparisonFilter(undefined)
      }
    },
    [
      addComparisonInput?.onChange,
      compareTextInput?.onChange,
      makePercentChangeInput?.onChange,
      onChangeSelectedComparisonFilterData,
      onChangeSelectedComparisonFilter,
    ]
  )

  const { input: showValuesInPlotInput } = useField(`${fieldName}.${SHOW_VALUES_IN_PLOT}`, {
    subscription: { value: true },
  })

  const { input: plotColorInput } = useField(`${fieldName}.${PLOT_COLOR}`, {
    subscription: { value: true },
  })

  const handleToggleShowValuesInPlot = useCallback(
    (e: CheckboxChangeEvent) => {
      const checked = e?.target?.checked
      // add default color if toggled to checked
      if (checked) {
        plotColorInput?.onChange(colors.blue400)
      }

      // remove color when toggling to unchecked
      if (!checked) {
        plotColorInput?.onChange(undefined)
      }

      // update show plots
      showValuesInPlotInput?.onChange(checked)
    },
    [plotColorInput?.onChange, showValuesInPlotInput?.onChange]
  )

  const handleOnChangeSelectedDataset = useCallback(
    (datasetSlug: string) => {
      if (datasetSlug) {
        getGroups({ params: { slug: datasetSlug } })
      }

      batch(() => {
        // add dataset_slug for save narrative endpoint payload
        onChangeSelectedDatasetSlug(datasetSlug)

        // and clear any selected group/metric/filters
        onChangeSelectedGroup(undefined)
        onChangeSelectedMetric(undefined)
        onChangeSelectedFilter(undefined)
        onChangeSelectedFilterData(undefined)
        onChangeSelectedComparisonFilter(undefined)
        onChangeSelectedComparisonFilterData(undefined)
      })
    },
    [
      onChangeSelectedGroup,
      onChangeSelectedMetric,
      onChangeSelectedFilter,
      onChangeSelectedFilterData,
      getGroups,
      onChangeSelectedComparisonFilter,
      onChangeSelectedComparisonFilterData,
    ]
  )

  const handleOnChangeSelectedGroup = useCallback(
    (groupSlug: string) => {
      batch(() => {
        // set group slug
        onChangeSelectedGroup(groupSlug)
        // and clear selected metrics
        onChangeSelectedMetric(undefined)
      })

      // fetch metrics
      getMetrics({ body: { dataset_slug: datasetSlug, group_slug: groupSlug, fields } })
    },
    [onChangeSelectedGroup, onChangeSelectedMetric, datasetSlug, fields]
  )

  const groupsOptions = useMemo(() => {
    if (groups) {
      const nonParentDuplicate = filter(groups, (g) => !g.is_parent)
      return map(nonParentDuplicate, (g) => ({ label: g.name, value: g.slug }))
    }

    return []
  }, [groups])

  useEffect(() => {
    if (!hasSetInitialValues) {
      if (datasetSlug) {
        getGroups({ params: { slug: datasetSlug } })
      }

      if (datasetSlug && selectedGroup && fields) {
        getMetrics({ body: { dataset_slug: datasetSlug, group_slug: selectedGroup, fields } })
      }

      setHasSetInitialValues(true)
    }
  }, [hasSetInitialValues, getGroups, getMetrics, datasetSlug, selectedGroup, fields])

  const metricOptions = useMemo(() => {
    // make sure there is a selected group before making metrics
    // user may have changed dataset - removing the group
    if (metrics?.all_metrics && selectedGroup) {
      return map(metrics.all_metrics, (m) => ({ label: m.label, value: m.id }))
    }

    return []
  }, [metrics, selectedGroup])

  const handleChangeSelectedFilter = useCallback(
    (value: string) => {
      const selectedFilterOption = find(metrics?.metric_options, ['label', value])
      batch(() => {
        if (selectedFilterOption) {
          // include filter data in form state
          // (needed for save endpoint payload)
          onChangeSelectedFilterData(selectedFilterOption.filters)
        }

        onChangeSelectedFilter(value)
      })
    },
    [metrics?.metric_options, onChangeSelectedFilterData, onChangeSelectedFilter]
  )

  const handleChangeSelectedComparisonFilter = useCallback(
    (value: string) => {
      const selectedFilterOption = find(metrics?.metric_options, ['label', value])
      batch(() => {
        if (selectedFilterOption) {
          // include filter data in form state
          // (needed for save endpoint payload)
          onChangeSelectedComparisonFilterData(selectedFilterOption.filters)
        }

        onChangeSelectedComparisonFilter(value)
      })
    },
    [metrics?.metric_options, onChangeSelectedComparisonFilterData, onChangeSelectedComparisonFilter]
  )

  const filterOptions = useMemo(() => {
    if (metrics?.metric_options && selectedGroup) {
      return map(metrics.metric_options, (op) => ({ label: op.label, value: op.label }))
    }

    return []
  }, [metrics?.metric_options, selectedGroup])

  // These values will be compiled and used to generate
  // right side (preview) content
  const valuesForCompile = useMemo(() => {
    // only return if it has the minimum values
    // dataset, group, metric
    if (!datasetSlug || !selectedGroup || !selectedMetric) {
      return {}
    }

    return {
      dataset_slug: datasetSlug,
      group_slug: selectedGroup,
      column_id: selectedMetric,
      filters: selectedFilterData || [],
      filter_label: selectedFilter,
      compare_filters: selectedComparisonFilterData || [],
      compare_filter_label: selectedComparisonFilter,
      make_percent_change: isBoolean(makePercentChangeInput?.value) ? makePercentChangeInput?.value : null,
      compare_text: compareTextInput?.value || null,
      name: renameInput?.value || null,
      description: descriptionInput?.value || null,
      show_values_in_plot: isBoolean(showValuesInPlotInput?.value) ? showValuesInPlotInput?.value : null,
      plot_color: plotColorInput?.value || null,
    }
  }, [
    datasetSlug,
    selectedGroup,
    selectedMetric,
    metrics?.metric_options,
    selectedFilter,
    selectedFilterData,
    renameInput?.value,
    descriptionInput?.value,
    selectedComparisonFilterData,
    selectedComparisonFilter,
    makePercentChangeInput?.value,
    compareTextInput?.value,
    fields,
    showValuesInPlotInput?.value,
    plotColorInput?.value,
  ])

  const {
    loading: compiling,
    response: compiledResponse = [],
    callback: runCompile,
    error: compileError,
  } = useCompileContent({
    fieldName,
    contents: [
      {
        type: CONTENT_TYPE_METRIC_V2,
        data: valuesForCompile as any,
      },
    ],
  })

  const handleRunCompile = useCallback(() => {
    runCompile({
      contents: [
        {
          type: CONTENT_TYPE_METRIC_V2,
          data: valuesForCompile as any,
        },
      ],
      fields,
    })
  }, [valuesForCompile, fields])

  // set callback for manually triggering compile
  useEffect(() => {
    if (handleRunCompile) {
      compileContentRef.current = handleRunCompile
    }
  }, [handleRunCompile])

  useEffect(() => {
    setCompileDisabled(isEmpty(selectedMetric))
  }, [setCompileDisabled, selectedMetric])

  // reload dataset and group options
  // (used in BasicContent in refresh button)
  const handleRefreshOptions = useCallback(() => {
    refetchDatasets()

    if (datasetSlug) {
      getGroups({ params: { slug: datasetSlug } })
    }

    if (datasetSlug && selectedGroup && fields) {
      getMetrics({ body: { dataset_slug: datasetSlug, group_slug: selectedGroup, fields } })
    }
  }, [refetchDatasets, getGroups, getMetrics, datasetSlug, selectedGroup, fields])

  // set callback for manually refreshing input options
  // (datasets and groups)
  useEffect(() => {
    if (handleRefreshOptions) {
      refreshInputOptionsRef.current = handleRefreshOptions
    }
  }, [handleRefreshOptions])

  const compiledResponseData = compiledResponse?.[0]?.value || {}

  const copyContentValues =
    !isEmpty(valuesForCompile) &&
    isString(valuesForCompile?.dataset_slug) &&
    isString(valuesForCompile?.group_slug) &&
    isString(valuesForCompile?.column_id)
      ? makeMetricCopiedContent({
          ...valuesForCompile,
          dataset_slug: valuesForCompile.dataset_slug,
          group_slug: valuesForCompile.group_slug,
          column_id: valuesForCompile.column_id,
        })
      : undefined

  return (
    <Flex>
      <SharedLayout.EditorBox>
        <Flex justifyContent={showRecompileAndRefreshButtons ? 'space-between' : 'flex-start'} alignItems="center">
          <Typography type="title400">Metric</Typography>

          {showRecompileAndRefreshButtons && (
            <CompileRefreshCtas
              compiling={compiling}
              handleRunCompile={handleRunCompile}
              handleRefreshOptions={handleRefreshOptions}
            />
          )}
        </Flex>

        <FormItem label="Select Dataset" meta={datasetMeta} layout="vertical" compact required>
          <Spin spinning={datasetsLoading}>
            <DatasetSearchBar
              datasetsOverride={datasets || []}
              onSelectOverride={handleOnChangeSelectedDataset}
              extraSelectProps={{ value: datasetSlug, withBorder: true }}
            />
          </Spin>
        </FormItem>

        <FormItem label="Select Group" meta={groupMeta} layout="vertical" compact required>
          <Spin spinning={groupsLoading}>
            <SearchSelect
              value={selectedGroup}
              onChange={handleOnChangeSelectedGroup}
              options={groupsOptions}
              data-test="metric-content-group-select"
            />
          </Spin>
        </FormItem>

        <FormItem label="Metric" meta={metricMeta} layout="vertical" compact required>
          <Spin spinning={metricsLoading}>
            <SearchSelect
              value={selectedMetric}
              onChange={onChangeSelectedMetric}
              options={metricOptions}
              data-test="metric-content-metric-select"
            />
          </Spin>
        </FormItem>

        {!isEmpty(filterOptions) && (
          <FormItem
            label="Filter Options"
            meta={filterMeta}
            layout="vertical"
            compact
            required
            tooltip={{
              title:
                'This filter will select the row of the dataset you want to reference. The metric value (selected above) will be shown for that row.',
              icon: <InfoCircleOutlined />,
              placement: 'right',
            }}
          >
            <Spin spinning={metricsLoading}>
              <SearchSelect
                value={selectedFilter}
                onChange={handleChangeSelectedFilter}
                options={filterOptions}
                data-test="metric-content-filter-select"
                popupMatchSelectWidth={false}
              />
            </Spin>
          </FormItem>
        )}

        <Collapse ghost>
          <Collapse.Panel header="Advanced Editing" key="advanced-editing">
            <FormItem label="Rename Metric" layout="vertical" compact>
              <Input
                {...renameInput}
                placeholder="Add a new name for the metric"
                data-test="metric-content-rename-input"
              />
            </FormItem>

            {/* Header is actually description under the hood - TLDR: b/c legacy */}
            <FormItem label="Header" layout="vertical" compact>
              <Input {...descriptionInput} placeholder="Add a header" data-test="metric-content-description-input" />
            </FormItem>

            <Divider fullPopoverWidth />

            <Box>
              <Checkbox checked={addComparisonInput.value} onChange={handleOnChangeAddComparison}>
                Add Comparison
              </Checkbox>

              {addComparisonInput?.value && (
                <Box>
                  <FormItem label="Comparison Filters" layout="vertical" compact>
                    <Spin spinning={metricsLoading}>
                      <SearchSelect
                        value={selectedComparisonFilter}
                        onChange={handleChangeSelectedComparisonFilter}
                        options={filterOptions}
                        popupMatchSelectWidth={false}
                      />
                    </Spin>
                  </FormItem>

                  <Box my={1}>
                    <Checkbox checked={makePercentChangeInput.value} onChange={makePercentChangeInput.onChange}>
                      Make Percent Change
                    </Checkbox>
                  </Box>

                  <FormItem label="Compare Text" layout="vertical" compact>
                    <Input {...compareTextInput} />
                  </FormItem>
                </Box>
              )}
            </Box>

            <Divider fullPopoverWidth />

            <Box>
              <Checkbox checked={showValuesInPlotInput.value} onChange={handleToggleShowValuesInPlot}>
                Show Values in Plot
              </Checkbox>
            </Box>

            {showValuesInPlotInput?.value && (
              <FormItem label="Plot Color" layout="vertical" compact>
                <SimpleColorPicker onChange={plotColorInput.onChange} value={plotColorInput.value} />
              </FormItem>
            )}
          </Collapse.Panel>
        </Collapse>
      </SharedLayout.EditorBox>

      <SharedLayout.PreviewBox>
        <AssembledContentContainer compiling={compiling} compileError={compileError}>
          {!isEmpty(compiledResponseData) && (
            <Flex mt={7} justifyContent="space-around" alignItems="center">
              {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
              {/* @ts-ignore */}
              <MetricGraphic {...compiledResponseData} copyContentValues={copyContentValues} />
            </Flex>
          )}
        </AssembledContentContainer>
      </SharedLayout.PreviewBox>
    </Flex>
  )
}

export default MetricContent
