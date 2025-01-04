import { Row } from '@/components/primitives/Axis'
import { Frame } from '@/components/primitives/Frame'
import { IRemoteOutputConfig } from '@/stores/datasets'

import DatasetOptionsMenu from './DatasetOptionsMenu'
import DatasetOptionsStatus from './DatasetOptionsStatus'

type Props = {
  onDrillInto?: () => void
  onExplore?: () => void
  onViewFullScreen?: () => void
} & IRemoteOutputConfig

const DatasetOptions = ({
  appliedFilters,
  datasetId,
  datasetName,
  isAll,
  plotSlug,
  snapshotTime,
  tabSlug,
  onDrillInto,
  onExplore,
  onViewFullScreen,
}: Props) => (
  <Frame x="3xl">
    <Row gap="md" items="center">
      <DatasetOptionsStatus appliedFilters={appliedFilters} isAll={isAll} />
      <DatasetOptionsMenu
        appliedFilters={appliedFilters}
        datasetId={datasetId}
        datasetName={datasetName}
        isAll={isAll}
        onDrillInto={onDrillInto}
        onExplore={onExplore}
        onViewFullScreen={onViewFullScreen}
        plotSlug={plotSlug}
        snapshotTime={snapshotTime}
        tabSlug={tabSlug}
      />
    </Row>
  </Frame>
)

export default DatasetOptions
