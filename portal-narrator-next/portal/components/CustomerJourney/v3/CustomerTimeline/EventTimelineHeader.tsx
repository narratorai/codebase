import { Flex, Switch } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { colors } from 'util/constants'
import { formatTimeStamp, timeFromNow } from 'util/helpers'

interface Props {
  firstEventTimestamp: string
  isAsc: boolean
  handleToggleAsc: () => void
}

const EventTimelineHeader = ({ firstEventTimestamp, isAsc, handleToggleAsc }: Props) => {
  const company = useCompany()
  const formattedFirstTimestampDate = formatTimeStamp(firstEventTimestamp, company.timezone, 'll')
  const firstTimestampAgo = timeFromNow(firstEventTimestamp, company.timezone)

  return (
    <Flex
      align="center"
      justify="space-between"
      style={{
        borderBottom: `1px solid ${colors.mavis_light_gray}`,
        marginBottom: '24px',
        paddingBottom: '16px',
      }}
    >
      <Flex align="center">
        <div style={{ marginRight: '8px', fontSize: '18px', lineHeight: '26px' }}>{formattedFirstTimestampDate}</div>

        <div style={{ color: colors.mavis_dark_gray, fontSize: '18px', lineHeight: '26px' }}>({firstTimestampAgo})</div>
      </Flex>

      <Switch checkedChildren="Asc" unCheckedChildren="Desc" checked={isAsc} onChange={handleToggleAsc} />
    </Flex>
  )
}

export default EventTimelineHeader
