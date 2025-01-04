import clsx from 'clsx'
import { Controller, useFormContext } from 'react-hook-form'

const ContextInput = () => {
  const { control, register } = useFormContext()

  return (
    <fieldset className="space-y-2">
      <label className="text-sm font-medium" htmlFor="context">
        Context
      </label>
      <Controller
        control={control}
        name="context"
        render={({ field, fieldState }) => (
          <textarea
            {...register('context')}
            autoFocus
            className={clsx('w-full rounded-xl !border-gray-100 p-4 pr-14', {
              '!border-red-600 !ring-red-600': fieldState.invalid,
            })}
            placeholder="Explain the problem you want the data team to solve. Please include any needed context."
            rows={6}
            {...field}
          />
        )}
      />
    </fieldset>
  )
}

export default ContextInput
