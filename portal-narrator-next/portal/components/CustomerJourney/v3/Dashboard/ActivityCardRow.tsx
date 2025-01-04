import { Col, Row } from 'antd-next'
import styled from 'styled-components'

import ActivityCard from './ActivityCard'
import { ACTIVITY_CARD_ROW_LENGTH } from './constants'
import { Activities, DayRangeValues } from './interfaces'

// make sure first and last cards in a row don't have left/right padding
// (keeps cards aligned with the edge of the container)
const CardContainer = styled.div<{ isFirst: boolean; isLast: boolean; rowIsFull: boolean }>`
  padding: 8px;

  ${({ isFirst }) =>
    isFirst &&
    `
  padding-left: 0px;
  `}

  ${({ isLast, rowIsFull }) =>
    isLast &&
    rowIsFull &&
    `
    padding-right: 0px;
  `}
`

interface Props {
  onSelectCustomer: (customer: any) => void
  tableId: string
  dayRange: DayRangeValues
  activities: Activities
}

const ActivityCardRow = ({ activities, onSelectCustomer, tableId, dayRange }: Props) => {
  // activities are broken into 3 per row
  // only remove right padding on the last card in a FULL row
  const rowIsFull = activities.length === ACTIVITY_CARD_ROW_LENGTH

  return (
    <Row>
      {activities.map((activity, index) => {
        const isFirst = index === 0
        const isLast = index === activities.length - 1

        return (
          <Col span={8} key={activity.id}>
            <CardContainer isFirst={isFirst} isLast={isLast} rowIsFull={rowIsFull}>
              <ActivityCard
                activity={activity}
                onSelectCustomer={onSelectCustomer}
                tableId={tableId}
                dayRange={dayRange}
              />
            </CardContainer>
          </Col>
        )
      })}
    </Row>
  )
}

export default ActivityCardRow
