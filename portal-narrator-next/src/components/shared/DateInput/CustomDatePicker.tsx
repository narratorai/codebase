import { useContext } from 'react'
import DatePicker, { type DatePickerProps } from 'react-datepicker'
import CalendarIcon from 'static/mavis/icons/calendar.svg'

import { formatShortTime } from '@/util/formatters'

import Context from './Context'
import CustomCalendarContainer from './CustomCalendarContainer'
import getHeader from './CustomHeader'
import { InputType } from './interfaces'

const CustomDatePicker = ({ selected, ...props }: DatePickerProps) => {
  const { configuration, inputType, selectInputType } = useContext(Context)

  /**
   * The DatePicker refuses to show time selection if it is initialized
   * without it (when the showTimeSelect is false when the component is loaded).
   * The workaround is to reset input type to DayTime every time the picker
   * is closed which ensures the time selection is present when it is opened next time.
   */
  const resetInputType = () => {
    selectInputType(InputType.DayTime)
  }

  const { locale, showTimeSelect, showWeekPicker, showMonthYearPicker, showQuarterYearPicker, showYearPicker } =
    configuration

  const date = selected?.toISOString() || new Date().toISOString()
  const timeCaption = formatShortTime(date, {})

  return (
    <DatePicker
      selected={selected}
      {...props}
      locale={locale}
      showTimeSelect={showTimeSelect}
      showWeekPicker={showWeekPicker}
      showMonthYearPicker={showMonthYearPicker}
      showQuarterYearPicker={showQuarterYearPicker}
      showYearPicker={showYearPicker}
      renderCustomHeader={getHeader(inputType)}
      calendarContainer={CustomCalendarContainer}
      showPopperArrow={false}
      timeCaption={timeCaption}
      onCalendarClose={resetInputType}
      className="date-input"
      showIcon
      icon={
        <CalendarIcon className="absolute bottom-0 right-0 top-0 box-content size-5 stroke-gray-600 p-2 text-gray-600" />
      }
    />
  )
}

export default CustomDatePicker
