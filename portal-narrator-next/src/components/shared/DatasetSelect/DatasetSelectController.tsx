import clsx from 'clsx'
import { Controller, useFormContext } from 'react-hook-form'

import DatasetSelect from './DatasetSelect'

interface Props {
  name: string
  onChange?: (value: string) => void
  placeholder?: string
}

export default function DatasetSelectController({ name, placeholder, onChange }: Props) {
  const { control, setValue } = useFormContext()

  const handleChange = (value: string) => {
    setValue(name, value)
    onChange?.(value)
  }

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <DatasetSelect
          className={clsx('w-full rounded-lg border-gray-100 text-sm', {
            '!border-red-600 !ring-red-600': fieldState.invalid,
          })}
          onChange={handleChange}
          placeholder={placeholder}
          value={field.value}
        />
      )}
    />
  )
}
