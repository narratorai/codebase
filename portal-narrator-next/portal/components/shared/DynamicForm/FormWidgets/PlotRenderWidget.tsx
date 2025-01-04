import { WidgetProps } from '@rjsf/core'
import { AntVPlotConfigs, AntVPlotTypes } from 'components/shared/AntVPlots/interfaces'
import DynamicPlot, { Props as DynamicPlotProps } from 'components/shared/DynamicPlot'
import { useMemo } from 'react'
import { makePlotCopiedContent } from 'util/shared_content/helpers'

interface PlotConfig {
  data: AntVPlotConfigs['data']
  chart_type?: AntVPlotTypes
  plot_config?: AntVPlotConfigs
  config?: {
    dataset_slug?: string
    dataset_name?: string
    group_slug?: string
    group_name?: string
    plot_slug?: string
  }
}

const parseValue = (value: string): PlotConfig | null => {
  try {
    return JSON.parse(value) as PlotConfig
  } catch (e) {
    return null
  }
}

const PlotRenderWidget = ({ value }: WidgetProps) => {
  const parsedValue = parseValue(value)

  const copyContentValues = useMemo(() => {
    // create copy content values if all fields present
    const datasetSlug = parsedValue?.config?.dataset_slug
    const groupSlug = parsedValue?.config?.group_slug
    const plotSlug = parsedValue?.config?.plot_slug

    if (datasetSlug && groupSlug && plotSlug) {
      return makePlotCopiedContent({ datasetSlug, groupSlug, plotSlug: plotSlug })
    }

    // otherwise there is nothing to copy
    return undefined
  }, [parsedValue?.config])

  return (
    <div data-private style={{ width: '100%' }}>
      <DynamicPlot copyContentValues={copyContentValues} {...(parsedValue as DynamicPlotProps)} />
    </div>
  )
}

export default PlotRenderWidget
