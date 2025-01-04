import { Space, Tooltip } from 'antd-next'
import { useUser } from 'components/context/user/hooks'
import ExploreIconDataset from 'components/Datasets/Explore/ExploreDatasetIcon'
import { IContent } from 'components/Narratives/interfaces'
import EditPlotIconModal from 'components/shared/AntVPlots/EditPlotIconModal'
import CopyContentIcon from 'components/shared/CopyContentIcon'
import { DynamicPlotMetadata } from 'components/shared/DynamicPlot'
import { ICompany } from 'graph/generated'
import { useFlags } from 'launchdarkly-react-client-sdk'
import { isFunction } from 'lodash'
import queryString from 'query-string'

import InfoTooltip from './InfoTooltip'
import LinkToDataset from './LinkToDataset'
import TrainingIconModal from './TrainingIconModal'

interface Props {
  metaData?: DynamicPlotMetadata
  company: ICompany
  copyContentValues?: IContent
  timezone: string
  getTooltipData?: (data: any) => void
  onEditPlotSubmit?: (data: any) => void

  /** It wont hide the copyContent icon though */
  hideTooltips?: boolean
  hideTraining?: boolean
  hideExplorer?: boolean
  showDrilldownTooltip?: boolean
}

const PlotTooltips = ({
  metaData,
  company,
  copyContentValues,
  timezone,
  onEditPlotSubmit,
  hideExplorer,
  hideTooltips,
  hideTraining,
  showDrilldownTooltip,
}: Props) => {
  const flags = useFlags()
  const { isSuperAdmin } = useUser()
  const allowPlotTraining = flags['plot-llm-training'] && isSuperAdmin && !hideTraining

  const datasetSlug = metaData?.dataset_slug
  const datasetObj = metaData?.dataset_obj
  const groupSlug = metaData?.group_slug
  const groupName = metaData?.group_name
  const plotSlug = metaData?.plot_slug
  const snapshotTime = metaData?.snapshot_time
  const narrative_slug = metaData?.narrative_slug
  const upload_key = metaData?.upload_key

  // narrative_slug and upload_key are useful when going to a dataset from assembled nar/dash
  const datasetLinkSearchParams = queryString.stringify({
    group: groupSlug,
    narrative_slug,
    upload_key,
    plot: plotSlug,
    view: plotSlug ? 'plot' : undefined,
  })

  return (
    <Space style={{ justifyContent: 'flex-end', alignItems: 'baseline' }}>
      {isFunction(onEditPlotSubmit) && !hideTooltips && datasetSlug && groupSlug && plotSlug && (
        <EditPlotIconModal datasetConfig={{ datasetSlug, groupSlug, plotSlug }} onSubmit={onEditPlotSubmit} />
      )}

      {/* Explore Dataset */}
      {!hideTooltips && !hideExplorer && datasetSlug && groupSlug && plotSlug && (
        <Tooltip title="Explore Dataset">
          <ExploreIconDataset
            datasetSlug={datasetSlug}
            groupSlug={groupSlug}
            plotSlug={plotSlug}
            narrativeSlug={narrative_slug}
            uploadKey={upload_key}
          />
        </Tooltip>
      )}

      {!hideTooltips && datasetSlug && groupName && groupSlug && (
        <LinkToDataset
          datasetSlug={datasetSlug}
          groupName={groupName}
          searchParams={datasetLinkSearchParams}
          company={company}
        />
      )}

      {allowPlotTraining && (
        <TrainingIconModal
          dataset_slug={datasetSlug}
          group_slug={groupSlug}
          plot_slug={plotSlug}
          dataset_obj={datasetObj}
        />
      )}

      {copyContentValues && <CopyContentIcon content={copyContentValues} />}

      {!hideTooltips && snapshotTime && (
        <InfoTooltip timezone={timezone} snapshotTime={snapshotTime} showDrilldownTooltip={showDrilldownTooltip} />
      )}
    </Space>
  )
}

export default PlotTooltips
