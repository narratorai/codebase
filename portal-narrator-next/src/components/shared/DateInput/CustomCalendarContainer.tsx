import { CalendarContainer } from 'react-datepicker'

import DateInputTypeSelect from './DateInputTypeSelect'

interface Props {
  className: string
  children: React.ReactNode
}

const CustomCalendarContainer = ({ className, children }: Props) => (
  <CalendarContainer className={className}>
    <div className="rounded-xl border border-gray-200 bg-white shadow-overlay flex-x">
      <DateInputTypeSelect />
      <div className="min-h-80 border-l border-gray-200 flex-x">{children}</div>
    </div>
  </CalendarContainer>
)

export default CustomCalendarContainer
