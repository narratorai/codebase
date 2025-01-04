import { Controller, useFormContext } from 'react-hook-form'

import { SelectContent, SelectItem, SelectRoot, SelectTrigger } from '@/components/shared/Select'

import { RequestType } from './interfaces'

const RequestTypeInput = () => {
  const { control } = useFormContext()

  return (
    <fieldset className="space-y-2">
      <label className="text-sm font-medium" htmlFor="requestType">
        Request type
      </label>
      <Controller
        control={control}
        name="requestType"
        render={({ field }) => (
          <SelectRoot onValueChange={(value) => field.onChange(value)}>
            <SelectTrigger className="w-1/2" placeholder="Request type">
              {field.value}
            </SelectTrigger>

            <SelectContent>
              {Object.entries(RequestType).map(([key, value]) => (
                <SelectItem className="p-2 hover:bg-gray-50" key={key} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </SelectRoot>
        )}
      />
    </fieldset>
  )
}

export default RequestTypeInput
