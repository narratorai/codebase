import { useCompany } from 'components/context/company/hooks'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { useParams } from 'react-router-dom'
import { colors } from 'util/constants'
import { formatTimeStamp, getDuration, minutesFormatter, timeFromNow } from 'util/helpers'

import { ICustomerJourneyActivityRowWithMoment } from '../services/interfaces'
import Timelines from './Timelines'

interface Props {
  activities: ICustomerJourneyActivityRowWithMoment[]
  previousDay?: ICustomerJourneyActivityRowWithMoment[]
  customer?: string
  goToRowId?: number
  isSidebar?: boolean
}

const ActivityDay = ({ activities, previousDay, customer, goToRowId, isSidebar }: Props) => {
  const company = useCompany()
  const { table } = useParams<{ table: string }>()

  const prettyDayDate = formatTimeStamp(activities[0].ts, company?.timezone, 'll')
  const prettyDayDateAgo = timeFromNow(activities[0].ts, company?.timezone)

  let timeSinceLastDay: undefined | number
  if (previousDay) {
    const duration = getDuration({ startTime: previousDay[0].ts, endTime: activities[0].ts })
    timeSinceLastDay = Math.abs(duration.asMinutes())
  }

  if (isSidebar) {
    return (
      <>
        <Box ml={6} mb={3}>
          <Typography type="title500" color={colors.gray500} mb={1}>
            {prettyDayDateAgo}
          </Typography>

          <Typography type="title300" fontWeight="bold">
            {prettyDayDate}
          </Typography>

          {timeSinceLastDay && (
            <Typography color={colors.gray500} mt={1}>
              {`${minutesFormatter(timeSinceLastDay, true)} since last activity`}
            </Typography>
          )}
        </Box>
        <Box ml="-200px" mt={1}>
          <Timelines
            activities={activities}
            timeSinceLastDay={timeSinceLastDay}
            isSidebar={isSidebar}
            timezone={company?.timezone}
            table={table || company?.tables[0]?.activity_stream}
            goToRowId={goToRowId}
            customer={customer}
          />
        </Box>
      </>
    )
  }

  return (
    // add some left padding if there is a customer - give space from sidebar
    <Flex ml="-224px">
      <Box relative style={{ left: 208 }}>
        <Box style={{ position: 'sticky', top: '27px' }} mb={7} width="144px">
          <Typography type="title500" color={colors.gray500} mb={'4px'} style={{ textAlign: 'right' }}>
            {prettyDayDateAgo}
          </Typography>
          <Typography
            type="title300"
            fontWeight="bold"
            style={{ textAlign: 'right' }}
            data-test="customer-activity-day-date"
          >
            {prettyDayDate}
          </Typography>
        </Box>
      </Box>

      <Box mt={1}>
        <Timelines
          activities={activities}
          timeSinceLastDay={timeSinceLastDay}
          isSidebar={isSidebar}
          timezone={company?.timezone}
          table={table || company?.tables[0]?.activity_stream}
          goToRowId={goToRowId}
          customer={customer}
        />
      </Box>
    </Flex>
  )
}

export default ActivityDay
