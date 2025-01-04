import { Spin } from 'antd-next'
import { PlotData } from 'components/Datasets/Modals/DatasetStory/interfaces'
import DynamicPlot, { Props as DynamicPlotProps } from 'components/shared/DynamicPlot'
import GoToDatasetButton from 'components/shared/GoToDatasetButton'
import { Box } from 'components/shared/jawns'
import { useEffect, useState } from 'react'
import useCallMavis, { useLazyCallMavis } from 'util/useCallMavis'

import ComponentText from './ComponentText'

interface GetPlotResponse {
  plot_slug: string
  group_slug: string
  dataset_obj: Record<string, any>
  components: {
    type: string
    enriched_by: string[]
    modifiers: string[]
  }
}

interface Props {
  id: string
}

const TrainingPlot = ({ id }: Props) => {
  const [hasFetchedPlotData, setHasFetchedPlotData] = useState(false)

  const { response: trainingData, loading: trainingDataLoading } = useCallMavis<GetPlotResponse>({
    method: 'GET',
    path: `/v1/llm/train/${id}`,
    errorNotificationProps: {
      placement: 'topLeft',
    },
  })
  const plotSlug = trainingData?.plot_slug
  const groupSlug = trainingData?.group_slug
  const dataset = trainingData?.dataset_obj
  const components = trainingData?.components

  // if a plot has been choosen - get the plot data
  const [getPlotData, { response: plotData, loading: loadingPlotData }] = useLazyCallMavis<PlotData>({
    method: 'POST',
    path: '/v1/dataset/plot/run',
    errorNotificationProps: {
      placement: 'topLeft',
    },
  })

  useEffect(() => {
    if (plotSlug && groupSlug && !!dataset && !hasFetchedPlotData) {
      setHasFetchedPlotData(true)

      getPlotData({
        body: { plot_slug: plotSlug, group_slug: groupSlug, dataset },
      })
    }
  }, [plotSlug, groupSlug, dataset, hasFetchedPlotData])

  return (
    <Spin spinning={trainingDataLoading || loadingPlotData}>
      <Box>
        <ComponentText title="Type" text={components?.type} />
        <ComponentText title="Enriched by" text={components?.enriched_by?.join(', ')} />
        <ComponentText title="Modifiers" text={components?.modifiers?.join(', ')} />
      </Box>

      <Box mb={2}>{plotData && <DynamicPlot {...(plotData as DynamicPlotProps)} />}</Box>

      <GoToDatasetButton
        dataset={dataset}
        groupSlug={groupSlug}
        plotSlug={plotSlug}
        errorNotificationProps={{ placement: 'topLeft' }}
      />
    </Spin>
  )
}

export default TrainingPlot
