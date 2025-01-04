import { Timeline } from 'antd-next'
import { Box, Flex } from 'components/shared/jawns'
import { map } from 'lodash'
import { colors } from 'util/constants'
import { ATTRIBUTE_COLOR, BEHAVIOR_COLOR } from 'util/datasets'

import ActivityPuzzlePiece from './ActivityPuzzlePiece'
import { IRelationshipCustomerJourneyConfig, IRelationshipCustomerJourneyLabelConfig } from './interfaces'
import RelationshipTitles from './RelationshipTitles'

interface Props {
  activeCustomer: string
  appendActivityName: string
  cohortActivityName: string
  customerJourneyConfig: IRelationshipCustomerJourneyConfig
  customerJourneyLabelConfig: IRelationshipCustomerJourneyLabelConfig
}

const RelationshipCustomerJourney = ({
  activeCustomer,
  appendActivityName,
  cohortActivityName,
  customerJourneyConfig,
  customerJourneyLabelConfig,
}: Props) => {
  // Using this to mock the size of the individual rows (and extra margin bottoms) in the Timeline
  // INDEX 0   1   2   3   4   5   6
  // ex:  [46, 46, 62, 46, 62, 62, 46]
  const indexPixelHeightMapping = map(customerJourneyConfig.customer, (row) => {
    if (row.bottomMargin) return 62
    return 46
  })

  const labels = customerJourneyLabelConfig[activeCustomer]

  return (
    <Box mr="80px" relative>
      <RelationshipTitles
        indexPixelHeightMapping={indexPixelHeightMapping}
        titles={customerJourneyConfig.relationshipTitles}
      />

      <Timeline mode="left">
        {map(customerJourneyConfig.customer, (row, index) => {
          const color = row.type === 'cohort' ? colors[BEHAVIOR_COLOR] : colors[ATTRIBUTE_COLOR]
          const name = row.type === 'cohort' ? cohortActivityName : appendActivityName
          return (
            <Timeline.Item
              key={`${row.type}.${index}`}
              label={labels[index]}
              color={color}
              style={{ marginBottom: row.bottomMargin ? 16 : 0 }}
            >
              <Flex>
                <ActivityPuzzlePiece name={name} {...row} />
              </Flex>
            </Timeline.Item>
          )
        })}
      </Timeline>
    </Box>
  )
}

export default RelationshipCustomerJourney
