import {
  Area,
  AreaConfig,
  Bar,
  BarConfig,
  Column,
  ColumnConfig,
  DualAxes,
  DualAxesConfig,
  Funnel,
  FunnelConfig,
  Line,
  LineConfig,
  Pie,
  PieConfig,
  Rose,
  RoseConfig,
  Sankey,
  SankeyConfig,
  Scatter,
  ScatterConfig,
  TinyArea,
  TinyAreaConfig,
} from '@ant-design/charts'
import { useCompany } from 'components/context/company/hooks'
import { IContent } from 'components/Narratives/interfaces'
import { DynamicPlotMetadata } from 'components/shared/DynamicPlot'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { isEmpty, isFunction } from 'lodash'
import { useEffect, useMemo, useState } from 'react'
import { getLocalTimezone } from 'util/helpers'

import { ANTV_TITLE_HEIGHT, TINY_PLOT_HEIGHT } from './constants'
import EmptyPlot from './EmptyPlot'
import { getPlotConfig } from './helpers'
import { AntVPlotConfigs, AntVPlotTypes } from './interfaces'
import PlotTooltips from './PlotTooltips'

interface Props {
  config?: AntVPlotConfigs
  type: AntVPlotTypes
  metaData?: DynamicPlotMetadata
  hideTooltips?: boolean // wont hide the copyContent icon though
  height?: number
  copyContentValues?: IContent
  onInitialized?: () => void
  useCompanyTimezone?: boolean
  getTooltipData?: (data: any) => void
  hideTraining?: boolean
  hideExplorer?: boolean
  onEditPlotSubmit?: (data: any) => void
}

/**
 * This component is responsible for:
 *  1) Determining which antV plot to render
 *  2) formatting labels, axes, and tooltips
 *  (This component is leveraged heavily in DynamicPlots)
 */
const AntVPlot = ({
  config,
  type,
  metaData,
  height,
  hideTooltips = false,
  copyContentValues,
  onInitialized,
  useCompanyTimezone = true,
  hideTraining = false,
  hideExplorer = false,
  getTooltipData,
  onEditPlotSubmit,
}: Props) => {
  const company = useCompany()
  const timezone = useCompanyTimezone ? company.timezone : getLocalTimezone()

  const plotTitle = config?.title?.text
  const showPlotTitle = config?.title?.visible && config?.title?.text
  const plotConfig = useMemo(
    () => getPlotConfig(company, timezone, height, config, type, getTooltipData),
    [company, timezone, height, config, type]
  ) as unknown

  // if an intialized function was passed
  // call it when the plot is ready
  const [hasInitialized, setHasInitialized] = useState(false)
  useEffect(() => {
    if (!hasInitialized && onInitialized && !!type && !!plotConfig) {
      onInitialized()
      setHasInitialized(true)
    }
  }, [hasInitialized, onInitialized, type, plotConfig])

  // if there is no data, show the empty state
  if (isEmpty(config?.data)) {
    return <EmptyPlot plotTitle={plotTitle} />
  }

  // don't show any title/tooltip/options if tiny plot
  if (type === 'tiny-area') {
    return (
      <Box style={{ height: TINY_PLOT_HEIGHT, width: '100%' }}>
        <TinyArea {...(plotConfig as TinyAreaConfig)} />
      </Box>
    )
  }

  return (
    <Box style={{ width: '100%' }}>
      <Flex
        justifyContent={showPlotTitle ? 'space-between' : 'flex-end'}
        alignItems="center"
        style={{ width: '100%', height: ANTV_TITLE_HEIGHT }}
      >
        {showPlotTitle && (
          <Typography type="title400" style={{ width: '100%' }}>
            {plotTitle}
          </Typography>
        )}

        <PlotTooltips
          metaData={metaData}
          company={company}
          copyContentValues={copyContentValues}
          timezone={timezone}
          onEditPlotSubmit={onEditPlotSubmit}
          hideTooltips={hideTooltips}
          hideExplorer={hideExplorer}
          hideTraining={hideTraining}
          showDrilldownTooltip={isFunction(getTooltipData)}
        />
      </Flex>

      {type === 'line' && <Line {...(plotConfig as LineConfig)} />}
      {type === 'column' && <Column {...(plotConfig as ColumnConfig)} />}
      {type === 'bar' && <Bar {...(plotConfig as BarConfig)} />}
      {type === 'pie' && <Pie {...(plotConfig as PieConfig)} />}
      {type === 'scatter' && <Scatter {...(plotConfig as ScatterConfig)} />}
      {type === 'area' && <Area {...(plotConfig as AreaConfig)} />}
      {type === 'rose' && <Rose {...(plotConfig as RoseConfig)} />}
      {type === 'dual-axes' && <DualAxes {...(plotConfig as DualAxesConfig)} />}
      {type === 'funnel' && <Funnel {...(plotConfig as FunnelConfig)} />}
      {type === 'sankey' && <Sankey {...(plotConfig as SankeyConfig)} />}
    </Box>
  )
}

export default AntVPlot
