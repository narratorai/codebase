import { CloseCircleTwoTone } from '@ant-design/icons'
import { Skeleton, Tooltip } from 'antd-next'
import ValueFormatter from 'components/shared/DataTable/ValueFormatter'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { colors } from 'util/constants'
import { percentify } from 'util/helpers'

import Arrow from './Arrow'

export type TimeResolution = 'day' | 'week' | 'month' | 'quarter' | 'year'
export type MetricFormat = 'percent' | 'number' | 'revenue' | 'string'

const formatter = new ValueFormatter(null, null)
const timeOverTime = (resolution: TimeResolution): string => {
  // returns a string year over year, day over day expressed as D.o.D
  const firstChar = resolution[0].toUpperCase()
  return `${firstChar}.o.${firstChar}`
}

export interface Props {
  name: string
  value?: string | number
  format?: MetricFormat
  timeResolution?: TimeResolution
  liftPercent?: number
  previousValue?: string | number
  error?: string
}

const MetricView = ({ name, value, format, liftPercent, previousValue, timeResolution, error }: Props) => {
  const displayName = name.length > 35 ? name.slice(0, 35) + '...' : name
  const displayValue = format ? formatter.formatValue(format, value, '') : value
  const liftColor = liftPercent && liftPercent > 0 ? colors.green500 : colors.red500
  const liftTooltip = previousValue && format && `Previous value: ${formatter.formatValue(format, previousValue, '')}`

  return (
    <Box style={{ minWidth: 160 }}>
      <Flex flexDirection={'column'} style={{ color: colors.gray600 }}>
        <Typography type="body100" style={{ height: 42, overflow: 'hidden', marginRight: 8 }}>
          {displayName}
        </Typography>
        <Box mt={1} style={{ height: 30 }}>
          {error ? (
            <Tooltip title={error}>
              <CloseCircleTwoTone style={{ fontSize: 20, marginLeft: 30 }} twoToneColor={colors.red400} />
            </Tooltip>
          ) : displayValue ? (
            <Typography type="title300">{displayValue}</Typography>
          ) : (
            <Skeleton.Button size="small" active />
          )}
        </Box>
        {liftPercent ? (
          <Tooltip title={liftTooltip} placement="topLeft" color={liftColor}>
            <Flex mt={1}>
              <Arrow lift={liftPercent} color={liftColor} />
              <Typography style={{ color: liftColor }}>{percentify(liftPercent)}</Typography>
              {timeResolution && <Typography ml={1}>{timeOverTime(timeResolution)}</Typography>}
            </Flex>
          </Tooltip>
        ) : (
          timeResolution && (
            <Typography type="body300">
              {timeResolution} to {timeResolution === 'day' ? 'now' : 'date'}
            </Typography>
          )
        )}
      </Flex>
    </Box>
  )
}

export default MetricView
