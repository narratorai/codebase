import { SearchSelect } from 'components/antd/staged'
import { IActivityIndexV2Query } from 'graph/generated'

type Activities = IActivityIndexV2Query['all_activities']

interface Props {
  activities: Activities
  onSelect: (id: string) => void
}

const AdditionalActivitySelect = ({ activities, onSelect }: Props) => {
  const options = activities.map((activity) => ({
    value: activity.id,
    label: activity.name,
  }))

  return <SearchSelect placeholder="Select an activity" options={options} onChange={onSelect} value={null} />
}

export default AdditionalActivitySelect
