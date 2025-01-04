import { Skeleton } from 'antd-next'
import AntVPlot from 'components/shared/AntVPlots/AntVPlot'
import EmptyPlot from 'components/shared/AntVPlots/EmptyPlot'
import { AntVPlotConfigs, AntVPlotTypes } from 'components/shared/AntVPlots/interfaces'
import { includes } from 'lodash'
import { useInView } from 'react-intersection-observer'
import { useLocation } from 'react-router'
import { IDatasetQueryDefinition } from 'util/datasets/interfaces'
import { CopiedPlotContent } from 'util/shared_content/interfaces'

export const PLOT_SKELETON_CLASS = 'in-view-plot-skeleton'

export interface DynamicPlotMetadata {
  dataset_obj?: IDatasetQueryDefinition
  dataset_name?: string
  dataset_slug?: string
  group_name?: string
  group_slug?: string
  plot_slug?: string
  snapshot_time?: string
  upload_key?: string
  narrative_slug?: string
  question?: string
}

export interface Props {
  chart_type?: AntVPlotTypes
  plot_config?: AntVPlotConfigs
  height?: number
  copyContentValues?: CopiedPlotContent
  onInitialized?: () => void
  useCompanyTimezone?: boolean
  forceRender?: boolean
  config?: DynamicPlotMetadata
  getTooltipData?: (data: any) => void
  datasetDoesNotExist?: boolean
  hideTraining?: boolean
  hideExplorer?: boolean
  onEditPlotSubmit?: (data: any) => void
}

const DynamicPlot = ({
  chart_type,
  plot_config,
  forceRender,
  height,
  copyContentValues,
  useCompanyTimezone = true,
  config,
  onInitialized,
  getTooltipData,
  hideTraining = false,
  hideExplorer = false,
  onEditPlotSubmit,
}: Props) => {
  const { pathname } = useLocation()

  // We don't want to show any of the hover tooltips when in a new/edit dataset page
  // (i.e. doesn't make sense to explore a dataset that you are already on)
  const isEditOrNewDatasetPage = includes(pathname, '/datasets/edit') || includes(pathname, 'datasets/new')

  // Only render antv plots if they are visible
  const [inViewRef, inView] = useInView({
    triggerOnce: true,
    skip: forceRender,
    rootMargin: '200px 0px 200px 0px',
  })

  if (!chart_type) return <EmptyPlot />

  return (
    <div ref={inViewRef}>
      {inView || forceRender ? (
        <AntVPlot
          config={plot_config}
          type={chart_type}
          metaData={config}
          height={height}
          hideTooltips={isEditOrNewDatasetPage}
          copyContentValues={copyContentValues}
          onInitialized={onInitialized}
          useCompanyTimezone={useCompanyTimezone}
          getTooltipData={getTooltipData}
          hideTraining={hideTraining}
          hideExplorer={hideExplorer}
          onEditPlotSubmit={onEditPlotSubmit}
        />
      ) : (
        <Skeleton.Input active />
      )}
    </div>
  )
}

export default DynamicPlot
