import type { PickerTimeProps } from 'antd-next/es/date-picker/generatePicker'
import type { Moment } from 'moment'
import * as React from 'react'

import DatePicker from './DatePicker'

export type TimePickerProps = Omit<PickerTimeProps<Moment>, 'picker'>

// until we migrate from moment to dayjs
// https://ant.design/docs/react/use-custom-date-library
const TimePicker = React.forwardRef<any, TimePickerProps>((props, ref) => (
  <DatePicker {...props} picker="time" ref={ref} />
))

TimePicker.displayName = 'TimePicker'

export default TimePicker
