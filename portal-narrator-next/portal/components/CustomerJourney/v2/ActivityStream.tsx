import { SyncOutlined } from '@ant-design/icons'
import { BackTop, Empty, Spin } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { Box, Flex } from 'components/shared/jawns'
import { isEmpty, map } from 'lodash'
import { colors } from 'util/constants'

import ActivityDay from './ActivityDay/ActivityDay'
import { assembleActivities } from './services/helpers'
import { IGetCustomerJourneyData } from './services/interfaces'

interface Props {
  customer?: string
  error?: string
  loading: boolean
  infiniteScrollLoading: boolean
  customerJourneyData?: IGetCustomerJourneyData
  isSidebar?: boolean
}

const ActivityStream = ({ error, loading, infiniteScrollLoading, customerJourneyData, customer, isSidebar }: Props) => {
  const company = useCompany()
  const activities = customerJourneyData?.data?.rows

  const activityDays =
    assembleActivities({
      activities,
      timezone: company?.timezone,
      collapseWithinMinutes: 5,
    }) || []

  const goToRowId = customerJourneyData?.go_to_row_id

  return (
    // different spacing if on the index page (no customer) vs customer page (with sidebar)
    <Box style={{ minHeight: 400 }}>
      <Spin size="large" tip="Loading..." spinning={loading && !infiniteScrollLoading} style={{ minHeight: 400 }}>
        {!loading && !infiniteScrollLoading && !error && isEmpty(activities) && (
          <Box mt={8}>
            <Empty description="No activities were found for this customer." />
          </Box>
        )}

        {map(activityDays, (day, idx) => (
          <ActivityDay
            activities={day}
            previousDay={idx !== 0 ? activityDays[idx - 1] : undefined}
            customer={customer}
            goToRowId={goToRowId}
            isSidebar={isSidebar}
            key={`${day[0]?._id}`}
          />
        ))}
        <BackTop />
      </Spin>

      {!isSidebar && infiniteScrollLoading && (
        <Flex justifyContent="center" style={{ color: colors.blue500 }}>
          <SyncOutlined spin style={{ fontSize: '24px' }} data-test="lazy-loading-customer-spinner" />
        </Flex>
      )}
    </Box>
  )
}

export default ActivityStream
