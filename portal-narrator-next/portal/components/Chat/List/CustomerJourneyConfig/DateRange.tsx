import { FormItem } from 'components/antd/staged'
import { DatePicker } from 'components/antd/TimeComponents'
import moment, { Moment } from 'moment'
import { RangeValue } from 'rc-picker/lib/interface'
import { useFormContext } from 'react-hook-form'

const { RangePicker } = DatePicker

interface Props {
  disabled: boolean
}

const DateRange = ({ disabled }: Props) => {
  const { watch, setValue } = useFormContext()

  const fromTime = watch('from_time')
  const momentFromTime = fromTime ? moment(fromTime) : null
  const toTime = watch('to_time')
  const momentToTime = toTime ? moment(toTime) : null

  const setFromTime = (value: string) => setValue('from_time', value, { shouldValidate: true })
  const setToTime = (value: string) => setValue('to_time', value, { shouldValidate: true })

  // set the to and from dates
  const handleConfirmDateRange = (dates: RangeValue<Moment>) => {
    if (dates && dates[0] && dates[1]) {
      setFromTime(dates[0].startOf('minute').toISOString())
      setToTime(dates[1].startOf('minute').toISOString())
    }
  }

  return (
    <FormItem label="Date Range" layout="vertical" compact>
      <RangePicker
        value={[momentFromTime, momentToTime]}
        onChange={handleConfirmDateRange}
        showTime={{ format: 'HH:mm' }}
        format="YYYY-MM-DD HH:mm"
        disabled={disabled}
      />
    </FormItem>
  )
}

export default DateRange
