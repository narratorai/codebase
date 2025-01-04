import { ReactDatePickerCustomHeaderProps } from 'react-datepicker'

import { formatYear } from '@/util/formatters'

const YearNavigationHeader = ({
  date,
  decreaseYear,
  increaseYear,
  prevYearButtonDisabled,
  nextYearButtonDisabled,
}: ReactDatePickerCustomHeaderProps) => (
  <div className="justify-between gap-1 rounded-lg bg-gray-50 p-1 flex-x">
    <button
      className="button button-xs secondary text !min-w-9 !justify-center focus:!shadow-none active:!shadow-none"
      onClick={decreaseYear}
      disabled={prevYearButtonDisabled}
    >
      {'<'}
    </button>

    <span className="px-8 py-2 text-center text-sm font-bold text-gray-900">{formatYear(date.toISOString(), {})}</span>

    <button
      className="button button-xs secondary text !min-w-9 !justify-center focus:!shadow-none active:!shadow-none"
      onClick={increaseYear}
      disabled={nextYearButtonDisabled}
    >
      {'>'}
    </button>
  </div>
)

export default YearNavigationHeader
