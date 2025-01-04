import { Empty, Skeleton } from 'antd-next'
import { isEmpty, take } from 'lodash'
import { useEffect } from 'react'
import { colors } from 'util/constants'
import { nDaysAgo } from 'util/helpers'
import { useLazyCallMavis } from 'util/useCallMavis'

import ActivityExample from './ActivityExample'
import { Activities, CustomerExample, DayRangeValues } from './interfaces'

interface GetExamplesResponse {
  examples_found: CustomerExample[]
}

interface Props {
  activity: Activities[number]
  onSelectCustomer: (customer: any) => void
  tableId: string
  dayRange: DayRangeValues
}

const ActivityExamples = ({ onSelectCustomer, tableId, dayRange, activity }: Props) => {
  const [getActivityExamples, { response: activityExamples, loading: loadingActivityExamples }] =
    useLazyCallMavis<GetExamplesResponse>({
      method: 'GET',
      path: `/v2/customer_journey/${tableId}/activity/${activity.slug}/examples`,
    })

  // get examples whenver the dayRange changes
  const fromTime = nDaysAgo(dayRange).format()
  useEffect(() => {
    getActivityExamples({ params: { from_time: fromTime } })
  }, [getActivityExamples, fromTime])

  const examples = activityExamples?.examples_found || []
  const visibleExamples = take(examples, 4)

  if (isEmpty(visibleExamples) && !loadingActivityExamples) {
    return (
      <div style={{ padding: 16 }}>
        <Empty
          description={
            <div style={{ color: colors.mavis_text_gray }}>No customer examples were found for this activity</div>
          }
        />
      </div>
    )
  }

  if (loadingActivityExamples) {
    return (
      <div style={{ padding: 16 }}>
        <Skeleton active />
      </div>
    )
  }

  return visibleExamples?.map((example, index) => {
    const isLast = index === visibleExamples.length - 1
    return (
      <ActivityExample
        example={example}
        isLast={isLast}
        onClick={onSelectCustomer}
        key={`${example.ts}_${example.customer}`}
      />
    )
  })
}

export default ActivityExamples
