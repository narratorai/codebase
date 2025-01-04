import { Flex, Typography } from 'components/shared/jawns'
import { filter, isEmpty, map, truncate } from 'lodash'
import { colors } from 'util/constants'

import { ICustomerJourneyActivityRowFeature } from '../services/interfaces'

interface Props {
  features: ICustomerJourneyActivityRowFeature[]
}

const FeatureValues = ({ features }: Props) => {
  // Only show non-(copy/link) features
  // They must have values
  const nonLinkCopyFeatures = filter(
    features,
    (feature) => !isEmpty(feature.value) && !feature.for_copy && !feature.for_link
  )

  if (isEmpty(nonLinkCopyFeatures)) {
    return null
  }

  return (
    <Flex flexWrap="wrap">
      {map(nonLinkCopyFeatures, (feature) => (
        <Flex mr={2} key={`${feature.label}:${feature.value}`}>
          <Typography color={colors.gray600} style={{ wordBreak: 'normal', whiteSpace: 'nowrap' }} mr={1}>
            {feature.label}:
          </Typography>
          <Typography
            color={colors.gray600}
            style={{ wordBreak: 'normal', whiteSpace: 'nowrap' }}
            title={feature.value.length > 30 ? feature.value : undefined}
          >
            {truncate(feature.value, { length: 30 })}
          </Typography>
        </Flex>
      ))}
    </Flex>
  )
}

export default FeatureValues
