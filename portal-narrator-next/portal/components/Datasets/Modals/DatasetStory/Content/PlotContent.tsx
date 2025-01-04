import { Skeleton, Spin } from 'antd-next'
import { SearchSelect } from 'components/antd/staged'
import DatasetStoryContext from 'components/Datasets/Modals/DatasetStory/DatasetStoryContext'
import { IDatasetStoryContext, PlotData } from 'components/Datasets/Modals/DatasetStory/interfaces'
import { GroupResponse } from 'components/Narratives/BuildNarrative/Sections/BasicContent/interfaces'
import DynamicPlot from 'components/shared/DynamicPlot'
import { Box } from 'components/shared/jawns'
import { filter, flatMap, isEmpty, map, split } from 'lodash'
import React, { useCallback, useContext, useEffect, useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import { IStoryContentPlot } from 'util/datasets/interfaces'
import { makePlotCopiedContent } from 'util/shared_content/helpers'
import { useLazyCallMavis } from 'util/useCallMavis'

interface Props {
  content: IStoryContentPlot
  index: number
}

const PlotContent = ({ content, index }: Props) => {
  const { datasetSlug, queryDefinition, allPlotConfig, setAllPlotConfig } =
    useContext<IDatasetStoryContext>(DatasetStoryContext) || {}
  const { setValue } = useFormContext()

  const isNew = !content?.plot?.slug
  const plotConfigKey = `${content.plot?.group_slug}.${content.plot?.slug}`
  const plotConfig = allPlotConfig[plotConfigKey]

  // if a plot has been choosen - get the plot data
  const [getPlotData, { response: plotData, loading: loadingPlotData, error: getPlotDataError }] =
    useLazyCallMavis<PlotData>({
      method: 'POST',
      path: '/v1/dataset/plot/run',
    })

  // if a plot has not been choosen (it's new)
  // get all the plot options (by getting all the groups)
  const [getGroups, { response: groups, loading: groupsLoading }] = useLazyCallMavis<GroupResponse[]>({
    method: 'GET',
    path: `/v1/narrative/content/get_dataset_groups`,
  })

  // if it's new - get groups to build plot options
  useEffect(() => {
    if (datasetSlug && isNew && isEmpty(groups) && !groupsLoading) {
      getGroups({ params: { slug: datasetSlug } })
    }
  }, [datasetSlug, getGroups, isNew, groups, groupsLoading])

  // if it's new - build plot options from groups
  const plotOptions = useMemo(() => {
    if (groups) {
      const nonParentDuplicate = filter(groups, (g) => !g.is_parent)
      return flatMap(nonParentDuplicate, (g) => {
        return map(g.plots, (plot) => {
          // mavis returns the plot slug as groupSug.plotSlug
          // to correctly match the option group in the Select
          return {
            key: plot.slug,
            label: plot.name,
            value: plot.slug, // value is groupSlug.plotSlug
            optGroupBy: g.name,
          }
        })
      })
    }
    return []
  }, [groups])

  const handleOnPlotSelect = useCallback(
    (value: string) => {
      const groupAndPlotSlugs = split(value, '.')
      const groupSlug = groupAndPlotSlugs[0]
      const plotSlug = groupAndPlotSlugs[1]

      setValue(`story.content.[${index}].plot`, { slug: plotSlug, group_slug: groupSlug }, { shouldValidate: true })

      getPlotData({
        body: { plot_slug: plotSlug, group_slug: groupSlug, dataset: queryDefinition },
      })
    },
    [getPlotData, queryDefinition, setValue, index]
  )

  // if plot config hasn't been loaded yet (and isn't a new plot)
  useEffect(() => {
    // fetch it and set to allPlotConfig
    if (
      !loadingPlotData &&
      !getPlotDataError &&
      content?.type === 'plot' &&
      content.plot &&
      !isNew &&
      isEmpty(plotConfig)
    ) {
      getPlotData({
        body: { plot_slug: content.plot.slug, group_slug: content.plot.group_slug, dataset: queryDefinition },
      })
    }
  }, [getPlotData, loadingPlotData, content, plotConfig, plotConfigKey, getPlotDataError, queryDefinition, isNew])

  // sets plot config to allPlotConfig one time so don't have to refetch on move up/down
  useEffect(() => {
    if (plotData && isEmpty(plotConfig)) {
      const updatedAllPlotConfig = { ...allPlotConfig }
      updatedAllPlotConfig[plotConfigKey] = plotData
      setAllPlotConfig(updatedAllPlotConfig)
    }
  }, [allPlotConfig, plotConfig, plotData, plotConfigKey, setAllPlotConfig])

  const copyContentValues = useMemo(() => {
    const groupSlug = content?.plot?.group_slug
    const plotSlug = content?.plot?.slug

    // create copy content if the needed slugs exist
    if (datasetSlug && groupSlug && plotSlug) {
      return makePlotCopiedContent({ datasetSlug, groupSlug, plotSlug })
    }

    return undefined
  }, [datasetSlug, content])

  return (
    <Box>
      {loadingPlotData && <Skeleton active />}

      {!isNew && !loadingPlotData && !getPlotDataError && (
        <Box pt={2}>
          <DynamicPlot {...plotConfig} copyContentValues={copyContentValues} />
        </Box>
      )}

      {isNew && !loadingPlotData && (
        <Spin spinning={groupsLoading}>
          <SearchSelect
            placeholder="Select a Plot"
            value={content.plot?.slug ? plotConfigKey : ''}
            onSelect={handleOnPlotSelect}
            options={plotOptions}
            popupMatchSelectWidth={false}
            isGrouped
            style={{ minWidth: '240px' }}
          />
        </Spin>
      )}
    </Box>
  )
}

export default PlotContent
