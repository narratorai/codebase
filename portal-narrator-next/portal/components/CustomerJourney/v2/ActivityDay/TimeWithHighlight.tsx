import { Tooltip } from 'antd-next'
import { Flex, Typography } from 'components/shared/jawns'
import { colors } from 'util/constants'
import { formatTimeStamp, timezoneAbbreviation } from 'util/helpers'

import { ICustomerJourneyActivityRowWithMoment } from '../services/interfaces'

interface Props {
  act: ICustomerJourneyActivityRowWithMoment
  timezone?: string
  goToRowId?: number
  isRepeatedActivity?: boolean
}

const TimeWithHighlight = ({ act, timezone, goToRowId, isRepeatedActivity }: Props) => {
  return (
    <Flex justifyContent="flex-end" pl={isRepeatedActivity ? 1 : 0}>
      <Tooltip title={`${act.ts} ${timezoneAbbreviation(timezone)}`}>
        <div>
          <Typography
            type="body100"
            // add lineHeight to center time text to timeline dot
            // (do to large activity name on right side of the dot)
            style={{ backgroundColor: act._id === goToRowId ? colors.yellow200 : 'inherit', lineHeight: 1.7 }}
          >
            {formatTimeStamp(act.ts, timezone, 'LT')}
          </Typography>
        </div>
      </Tooltip>
    </Flex>
  )
}

export default TimeWithHighlight
