import { InfoCircleOutlined } from '@ant-design/icons'
import { Tooltip } from 'antd-next'
import { Box, Typography } from 'components/shared/jawns'
import { formatTimeStampUtc } from 'util/helpers'

interface Props {
  timezone: string
  snapshotTime: string
  showDrilldownTooltip?: boolean
}

const InfoTooltip = ({ timezone, snapshotTime, showDrilldownTooltip = false }: Props) => {
  return (
    <Tooltip
      title={
        <Box>
          <Typography>{`Last updated ${formatTimeStampUtc(snapshotTime, timezone)}`}</Typography>

          {showDrilldownTooltip && (
            <Box mt={1}>
              <Typography>This plot supports drilldown.</Typography>
              <Typography>
                When hovering over a plot point, press "d" to see underlying data that makes this data point.
              </Typography>
            </Box>
          )}
        </Box>
      }
    >
      <InfoCircleOutlined />
    </Tooltip>
  )
}

export default InfoTooltip
