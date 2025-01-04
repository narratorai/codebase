import { Avatar } from '@/components/primitives/Avatar'
import { Tooltip } from '@/components/primitives/Tooltip'

interface Props {
  appliedFilters?: any[]
  isAll: boolean
}

const DatasetOptionsStatus = ({ appliedFilters, isAll }: Props) => {
  const filtered = appliedFilters && appliedFilters.length > 0 ? true : false

  if (filtered || !isAll) return null

  return (
    <>
      {filtered && (
        <Tooltip tip="This data has an additional filter used above the Dataset">
          <Avatar color="blue" icon="SolidFunnelIcon" size="sm" />
        </Tooltip>
      )}
      {!isAll && (
        <Tooltip tip="Data was too large and had to be limited to 500 rows due to plotting limitation">
          <Avatar color="blue" icon="SolidQueueListIcon" size="sm" />
        </Tooltip>
      )}
    </>
  )
}

export default DatasetOptionsStatus
