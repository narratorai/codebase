import { Flex, Tag } from 'antd-next'
import styled from 'styled-components'
import { colors } from 'util/constants'

import ActivityExamples from './ActivityExamples'
import { Activities, DayRangeValues } from './interfaces'

const StyledCard = styled.div`
  background-color: white;
  border-radius: 16px;
`
interface Props {
  activity: Activities[number]
  onSelectCustomer: (customer: any) => void
  tableId: string
  dayRange: DayRangeValues
}

const ActivityCard = ({ activity, onSelectCustomer, tableId, dayRange }: Props) => {
  const companyCategory = activity.company_category

  return (
    <StyledCard>
      <Flex
        justify="space-between"
        align="center"
        style={{ padding: 16, borderBottom: `1px solid ${colors.mavis_light_gray}` }}
      >
        <div style={{ fontSize: '18px', fontWeight: 600 }}>{activity.name}</div>

        {companyCategory && <Tag color={companyCategory.color || 'defualt'}>{companyCategory.category}</Tag>}
      </Flex>

      <ActivityExamples activity={activity} onSelectCustomer={onSelectCustomer} tableId={tableId} dayRange={dayRange} />
    </StyledCard>
  )
}

export default ActivityCard
