import { DatePicker as AntdDatePicker } from 'antd-next'
import type { Moment } from 'moment'
import momentGenerateConfig from 'rc-picker/lib/generate/moment'

// until we migrate from moment to dayjs
// https://ant.design/docs/react/use-custom-date-library
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore rc-picker's typing is not compatible with antd's Moment types
const DatePicker = AntdDatePicker.generatePicker<Moment>(momentGenerateConfig)

export default DatePicker
