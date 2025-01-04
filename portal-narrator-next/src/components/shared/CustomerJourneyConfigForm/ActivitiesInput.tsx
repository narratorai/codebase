import { Controller, useFormContext } from 'react-hook-form'

import ActivitySelect from '@/components/shared/ActivitySelect'

const ActivitiesInput = () => {
  const { control } = useFormContext()

  return (
    <fieldset className="space-y-2">
      <Controller
        name="activities"
        control={control}
        render={({ field }) => <ActivitySelect onValueChange={(items: string[]) => field.onChange(items)} />}
      />
    </fieldset>
  )
}

export default ActivitiesInput
