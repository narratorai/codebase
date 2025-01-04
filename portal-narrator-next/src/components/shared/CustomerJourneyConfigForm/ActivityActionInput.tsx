import { Controller, useFormContext } from 'react-hook-form'

import { SelectContent, SelectDefaultTrigger, SelectItem, SelectRoot } from '@/components/shared/Select'

import { ActivityAction } from './interfaces'

const ActivityActionInput = () => {
  const { control } = useFormContext()

  return (
    <fieldset className="space-y-2">
      <label htmlFor="activityAction" className="px-1 text-sm font-medium text-gray-1000">
        Activities
      </label>
      <Controller
        name="activityAction"
        control={control}
        render={({ field }) => (
          <SelectRoot onValueChange={(value: string) => field.onChange(value)}>
            <SelectDefaultTrigger className={'min-w-32'} placeholder="Request type" />

            <SelectContent align="start" sideOffset={4}>
              {Object.entries(ActivityAction).map(([key, value]) => (
                <SelectItem key={key} value={value}>
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

export default ActivityActionInput
