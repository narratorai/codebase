import { Checkbox, Slider, Spin } from 'antd-next'
import { CheckboxChangeEvent } from 'antd-next/es/checkbox'
import { FormItem, SearchSelect } from 'components/antd/staged'
import DatasetSearchBar from 'components/Datasets/DatasetSearchBar'
import { useBuildNarrativeContext } from 'components/Narratives/BuildNarrative/BuildNarrativeProvider'
import AssembledContentContainer from 'components/Narratives/BuildNarrative/Sections/BasicContent/AssembledContentContainer'
import PlotAnnotations from 'components/Narratives/BuildNarrative/Sections/BasicContent/PlotAnnotations'
import * as SharedLayout from 'components/Narratives/BuildNarrative/Sections/SharedLayout'
import { useCompileContent } from 'components/Narratives/hooks'
import { AntVPlotTypes } from 'components/shared/AntVPlots/interfaces'
import ColorsPicker from 'components/shared/ColorsPicker'
import DynamicPlot from 'components/shared/DynamicPlot'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { each, filter, flatMap, isEmpty, map } from 'lodash'
import React, { MutableRefObject, useCallback, useEffect, useMemo, useState } from 'react'
import { useField } from 'react-final-form'
import { METRIC_MAXWIDTH } from 'util/analyses/constants'
import { PLOT_HEIGHT } from 'util/constants'
import { CONTENT_TYPE_PLOT_V2 } from 'util/narratives'
import { makePlotCopiedContent } from 'util/shared_content/helpers'
import { useLazyCallMavis } from 'util/useCallMavis'

import CompileRefreshCtas from './CompileRefreshCtas'
import { GroupResponse } from './interfaces'

const DATASET_SLUG_FIELDNAME = 'data.dataset_slug'
const GROUP_SLUG_FIELDNAME = 'data.group_slug'
const PLOT_FIELDNAME = 'data.plot_slug'
const COLORS_FIELDNAME = 'data.colors'
const SHOW_COLORS_FIELDNAME = 'data.show_colors'
const HEIGHT_FIELDNAME = 'data.height'
const ANNOTATIONS_FIELDNAME = 'data.annotations'

export interface CompiledResponse {
  type: string
  value: {
    config: {
      dataset_name: string
      dataset_slug: string
      group_name: string
      group_slug: string
      plot_slug: string
      snapshot_time: string
      x_type: string
    }
    data: any[]
    layout: any
    chart_type?: AntVPlotTypes
  }
}

interface Props {
  fieldName: string
  setCompileDisabled: (disabled: boolean) => void
  compileContentRef: MutableRefObject<(() => void) | undefined>
  refreshInputOptionsRef: MutableRefObject<(() => void) | undefined>
  isDashboard?: boolean
  showRecompileAndRefreshButtons?: boolean
}

const PlotContent = ({
  fieldName,
  compileContentRef,
  setCompileDisabled,
  refreshInputOptionsRef,
  isDashboard = false,
  showRecompileAndRefreshButtons = false,
}: Props) => {
  // set this to true on first update
  const [hasSetInitialValues, setHasSetInitialValues] = useState(false)

  const {
    assembledFieldsResponse,
    availableDatasets: datasets,
    availableDatasetsLoading: datasetsLoading,
    refetchDatasets,
  } = useBuildNarrativeContext()
  const fields = assembledFieldsResponse?.fields

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

  const handleOnChangeSelectedDataset = useCallback(
    (value: string) => {
      // note: value comes from DatasetSearchBar: `${slug} ${tag}`
      const datasetSlug = value?.split(' ')[0] || undefined

      if (datasetSlug) {
        getGroups({ params: { slug: datasetSlug } })
      }

      onChangeSelectedDatasetSlug(datasetSlug)
    },
    [onChangeSelectedDatasetSlug, getGroups]
  )

  const {
    input: { value: contentValues },
  } = useField(fieldName, { subscription: { value: true } })

  const copyContentValues = useMemo(() => {
    const datasetSlug = contentValues?.data?.dataset_slug
    const groupSlug = contentValues?.data?.group_slug
    const plotSlug = contentValues?.data?.plot_slug

    // don't try to copy values if it doesn't have the necessary slugs
    if (!datasetSlug || !groupSlug || !plotSlug) {
      return undefined
    }

    return makePlotCopiedContent({ datasetSlug, groupSlug, plotSlug })
  }, [contentValues])

  const {
    input: { value: groupSlug, onChange: onChangeGroupSlug },
  } = useField(`${fieldName}.${GROUP_SLUG_FIELDNAME}`, { subscription: { value: true } })

  const {
    input: { value: selectedPlot, onChange: onChangeSelectedPlot, meta: plotMeta },
  } = useField(`${fieldName}.${PLOT_FIELDNAME}`, { subscription: { value: true } })

  const {
    input: { value: showColors, onChange: onChangeShowColors },
  } = useField(`${fieldName}.${SHOW_COLORS_FIELDNAME}`, { subscription: { value: true } })

  const {
    input: { value: colors, onChange: onChangeColors },
  } = useField(`${fieldName}.${COLORS_FIELDNAME}`, { subscription: { value: true } })

  const {
    input: { value: height, onChange: onChangeHeight },
  } = useField(`${fieldName}.${HEIGHT_FIELDNAME}`, { subscription: { value: true } })

  const {
    input: { value: annotations },
  } = useField(`${fieldName}.${ANNOTATIONS_FIELDNAME}`, { subscription: { value: true } })

  const handleOnChangeShowColors = useCallback(
    (e: CheckboxChangeEvent) => {
      const checked = e.target.checked

      // if they uncheck the override colors
      if (!checked) {
        // remove the overrides
        onChangeColors(undefined)
      }

      onChangeShowColors(checked)
    },
    [onChangeShowColors, onChangeColors]
  )

  const handleOnChangeSelectedPlot = useCallback(
    (plotSlug: string) => {
      // find group slug via selectedPlot slug
      each(groups, (grp) => {
        each(grp.plots, (plot) => {
          if (plot.slug === plotSlug) {
            return onChangeGroupSlug(grp.slug)
          }
        })
      })

      // update plot slug
      onChangeSelectedPlot(plotSlug)
    },
    [onChangeSelectedPlot, onChangeGroupSlug, groups]
  )

  // get initial group options on page load
  useEffect(() => {
    if (!hasSetInitialValues) {
      if (datasetSlug) {
        getGroups({ params: { slug: datasetSlug } })
      }

      setHasSetInitialValues(true)
    }
  }, [hasSetInitialValues, getGroups, datasetSlug])

  const plotOptions = useMemo(() => {
    if (groups) {
      const nonParentDuplicate = filter(groups, (g) => !g.is_parent)
      return flatMap(nonParentDuplicate, (g) =>
        map(g.plots, (plot) => ({
          label: plot.name,
          value: plot.slug,
          optGroupBy: g.name,
        }))
      )
    }
    return []
  }, [groups])

  // These values will be compiled and used to generate
  // right side (preview) content
  const valuesForCompile = useMemo(() => {
    // only return if it has the minimum values
    // dataset, groups, plot

    if (!datasetSlug || !groupSlug || !selectedPlot) {
      return {}
    }

    return {
      dataset_slug: datasetSlug,
      group_slug: groupSlug,
      plot_slug: selectedPlot,
      colors: colors || null,
      height: height || null,
      annotations: annotations || null,
    }
  }, [datasetSlug, groupSlug, selectedPlot, colors, height, annotations])

  const {
    loading: compiling,
    response: compiledResponse = [],
    callback: runCompile,
    error: compileError,
  } = useCompileContent({
    contents: [
      {
        type: CONTENT_TYPE_PLOT_V2,
        data: valuesForCompile as any,
      },
    ],
    fieldName,
  })

  const handleRunCompile = useCallback(() => {
    runCompile({
      contents: [
        {
          type: CONTENT_TYPE_PLOT_V2,
          data: valuesForCompile as any,
        },
      ],
      fields,
    })
  }, [valuesForCompile, fields, runCompile])

  // set callback for manually triggering compile
  useEffect(() => {
    if (handleRunCompile) {
      compileContentRef.current = handleRunCompile
    }
  }, [handleRunCompile])

  // reload dataset and group options
  // (used in BasicContent in refresh button)
  const handleRefreshOptions = useCallback(() => {
    refetchDatasets()

    if (datasetSlug) {
      getGroups({ params: { slug: datasetSlug } })
    }
  }, [refetchDatasets, getGroups, datasetSlug])

  // set callback for manually refreshing input options
  // (datasets and groups)
  useEffect(() => {
    if (handleRefreshOptions) {
      refreshInputOptionsRef.current = handleRefreshOptions
    }
  }, [handleRefreshOptions])

  useEffect(() => {
    setCompileDisabled(isEmpty(selectedPlot))
  }, [setCompileDisabled, selectedPlot])

  // set default height if it hasn't been set before
  useEffect(() => {
    if (!height && !isDashboard) {
      onChangeHeight(PLOT_HEIGHT)
    }
  }, [height, isDashboard, onChangeHeight])

  const compiledResponseData = (compiledResponse?.[0]?.value || {}) as CompiledResponse['value']
  return (
    <Flex>
      <SharedLayout.EditorBox>
        <Box pb={2} data-test="plot-content-edit-section">
          <Flex justifyContent={showRecompileAndRefreshButtons ? 'space-between' : 'flex-start'} alignItems="center">
            <Typography type="title400">Plot</Typography>

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

          <FormItem label="Select Plot" meta={plotMeta} layout="vertical" compact required>
            <Spin spinning={groupsLoading}>
              <SearchSelect
                data-test="plot-content-plot-select"
                value={selectedPlot}
                onChange={handleOnChangeSelectedPlot}
                options={plotOptions}
                popupMatchSelectWidth={false}
                isGrouped
              />
            </Spin>
          </FormItem>

          <Box mt={1}>
            <Checkbox checked={showColors} onChange={handleOnChangeShowColors}>
              Override Theme Colors
            </Checkbox>
          </Box>

          {showColors && (
            <Box mt={1}>
              <ColorsPicker value={colors} onChange={onChangeColors} />
            </Box>
          )}

          {/* only show plot height option for narratives */}
          {!isDashboard && (
            <Box mt={2}>
              <FormItem label={`Plot Height: ${height}px`} layout="vertical">
                <Slider
                  tooltip={{ formatter: (height) => `${height}px` }}
                  value={height}
                  onChange={onChangeHeight}
                  min={100}
                  max={1200}
                />
              </FormItem>
            </Box>
          )}

          {/* Annotations */}
          <Box mt={2}>
            <PlotAnnotations fieldName={`${fieldName}.${ANNOTATIONS_FIELDNAME}`} />
          </Box>
        </Box>
      </SharedLayout.EditorBox>

      <SharedLayout.PreviewBox>
        <AssembledContentContainer compiling={compiling} compileError={compileError}>
          {!compileError && (
            <Box data-private data-test="plot-content-preview" maxWidth={METRIC_MAXWIDTH} mx="auto" px={3}>
              <Box mb="4px" mt="20px">
                <DynamicPlot {...compiledResponseData} height={height} copyContentValues={copyContentValues} />
              </Box>
            </Box>
          )}
        </AssembledContentContainer>
      </SharedLayout.PreviewBox>
    </Flex>
  )
}

export default PlotContent
