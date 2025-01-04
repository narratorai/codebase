import { Controller, useFormContext } from 'react-hook-form'

import DateInput from '@/components/shared/DateInput'

const DateRangeInput = () => {
  const { control } = useFormContext()

  return (
    <fieldset className="space-y-2">
      <label htmlFor="dateRange" className="px-1 text-sm font-medium text-gray-1000">
        Date range
      </label>
      <Controller
        name="dateRange"
        control={control}
        render={({ field }) => (
          <DateInput
            selectsRange
            selected={field.value?.[0]}
            startDate={field.value?.[0]}
            endDate={field.value?.[1]}
            onChange={(dates: (Date | null)[]) => field.onChange(dates)}
          />
        )}
      />
    </fieldset>
  )
}

export default DateRangeInput
