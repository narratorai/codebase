import { Tooltip, Typography } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { isEmpty } from 'lodash'
import { colors } from 'util/constants'
import { formatTimeStamp } from 'util/helpers'

import { TimelineEvent } from './interfaces'

interface Props {
  timestamp?: string
  timeDifferenceOption?: TimelineEvent
}

const TimelineLabel = ({ timestamp, timeDifferenceOption }: Props) => {
  const company = useCompany()

  // show date if timeDifferenceOption is present
  // and it's a new day
  if (!isEmpty(timeDifferenceOption)) {
    const startTime = timeDifferenceOption?.startTime
    const endTime = timeDifferenceOption?.endTime
    const startDay = formatTimeStamp(startTime, company.timezone, 'D')
    const endDay = formatTimeStamp(endTime, company.timezone, 'D')
    const isNewDay = startDay !== endDay

    // show nothing if it's not a new day
    if (!isNewDay) {
      return null
    }

    // otherwise show the formatted date
    const formattedNewDay = formatTimeStamp(startTime, company.timezone, 'll')

    return <div style={{ color: colors.mavis_dark_gray, fontSize: '16px', lineHeight: '23px' }}>{formattedNewDay}</div>
  }

  // ensure there is a timestamp for the tooltip/label
  if (!timestamp) {
    return null
  }

  const formattedTimestamp = formatTimeStamp(timestamp, company.timezone, 'h:mm A')

  return (
    <Tooltip title={`${timestamp} (UTC)`}>
      <Typography.Title level={5} style={{ marginBottom: 0, marginRight: '8px' }}>
        {formattedTimestamp}
      </Typography.Title>
    </Tooltip>
  )
}

export default TimelineLabel
