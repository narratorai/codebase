import { ReactDatePickerCustomHeaderProps } from 'react-datepicker'

import { formatMonthOfYear } from '@/util/formatters'

const MonthNavigationHeader = ({
  date,
  decreaseMonth,
  increaseMonth,
  prevMonthButtonDisabled,
  nextMonthButtonDisabled,
}: ReactDatePickerCustomHeaderProps) => (
  <div className="justify-between gap-1 rounded-lg bg-gray-50 p-1 flex-x">
    <button
      className="button button-xs secondary text !min-w-9 !justify-center focus:!shadow-none active:!shadow-none"
      onClick={decreaseMonth}
      disabled={prevMonthButtonDisabled}
    >
      {'<'}
    </button>

    <span className="px-8 py-2 text-center text-sm font-bold text-gray-900">
      {formatMonthOfYear(date.toISOString(), {})}
    </span>

    <button
      className="button button-xs secondary text !min-w-9 !justify-center focus:!shadow-none active:!shadow-none"
      onClick={increaseMonth}
      disabled={nextMonthButtonDisabled}
    >
      {'>'}
    </button>
  </div>
)

export default MonthNavigationHeader
