import { Box } from 'components/shared/jawns'
import { filter, isEmpty, map } from 'lodash'

import { ICustomerJourneyActivityRow } from '../services/interfaces'
import TableWithRows from '../TableWithRows'
import FeatureValue from './FeatureValue'

interface Props {
  activity: ICustomerJourneyActivityRow
  onlyLinksAndCopy?: boolean
}

const FeatureTable = ({ activity, onlyLinksAndCopy }: Props) => {
  // if there are no features, don't show the table
  if (isEmpty(activity.features)) {
    return null
  }

  const showableFeatures = onlyLinksAndCopy
    ? filter(activity.features, (feature) => feature.for_copy || feature.for_link)
    : activity.features

  const items = map(showableFeatures, (feature) => ({
    label: feature.label,
    value: <FeatureValue feature={feature} />,
  }))

  return (
    <Box p={1} style={{ maxWidth: '464px', maxHeight: '464px', overflowY: 'auto' }}>
      <TableWithRows items={items} />
    </Box>
  )
}

export default FeatureTable
