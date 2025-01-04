import { Typography } from 'antd-next'
import { Activities } from 'components/Activities/v2/interfaces'

import AdditionalActivitySelect from './AdditionalActivitySelect'

interface Props {
  onSelect: (id: string) => void
  activities: Activities
}

// Represents non-favorited activities that are not default visible
// Allows you to select additional activities to view
const AdditionalActivities = ({ onSelect, activities }: Props) => {
  return (
    <div>
      <div style={{ marginTop: '32px' }}>
        <Typography.Title level={5}>Don't see the activity you're looking for?</Typography.Title>
      </div>

      <div style={{ maxWidth: '320px' }}>
        <AdditionalActivitySelect activities={activities} onSelect={onSelect} />
      </div>
    </div>
  )
}

export default AdditionalActivities
