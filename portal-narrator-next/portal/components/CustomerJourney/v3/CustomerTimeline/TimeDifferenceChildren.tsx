import { colors } from 'util/constants'
import { getDuration, minutesFormatter } from 'util/helpers'

interface Props {
  startTime: string
  endTime: string
  isAsc: boolean
}

const TimeDifferenceChildren = ({ startTime, endTime, isAsc }: Props) => {
  const duration = getDuration({ startTime, endTime })
  const timeSinceLastEvent = Math.abs(duration.asMinutes())
  const minutesSinceLastEvent = minutesFormatter(timeSinceLastEvent, true)

  return (
    <div style={{ color: colors.mavis_dark_gray, fontSize: '18px', lineHeight: '23px' }}>
      {`${minutesSinceLastEvent} ${isAsc ? 'later' : 'ealier'}`}
    </div>
  )
}

export default TimeDifferenceChildren
