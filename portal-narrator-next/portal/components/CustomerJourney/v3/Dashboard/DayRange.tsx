import { Flex, Select } from 'antd-next'
import CalendarIcon from 'static/img/calendar.svg'

interface Props {
  onChange: (value: 1 | 7 | 30 | 60 | 90) => void
  value: 1 | 7 | 30 | 60 | 90
}

const Label = ({ text }: { text: string }) => (
  <Flex align="center">
    <CalendarIcon />
    <span style={{ marginLeft: '4px' }}>{text}</span>
  </Flex>
)

const OPTIONS = [
  {
    label: <Label text="Last 24 Hours" />,
    value: 1,
  },
  {
    label: <Label text="Last Week" />,
    value: 7,
  },
  {
    label: <Label text="Last 30 Days" />,
    value: 30,
  },
  {
    label: <Label text="Last 60 Days" />,
    value: 60,
  },
  {
    label: <Label text="Last 90 Days" />,
    value: 90,
  },
]

const DayRange = ({ onChange, value }: Props) => {
  return <Select value={value} onChange={onChange} options={OPTIONS} />
}

export default DayRange
