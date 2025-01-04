import clsx from 'clsx'
import { isEmpty } from 'lodash'
import { Controller, useFormContext } from 'react-hook-form'

import DatasetTabSelect from './DatasetTabSelect'

interface Props {
  datasetId: string
  name: string
  onChange?: () => void
  placeholder?: string
}

export default function DatasetTabSelectController({ name, placeholder, onChange, datasetId }: Props) {
  const { control, setValue } = useFormContext()

  const handleChange = (value: string) => {
    setValue(name, value)
    onChange?.()
  }

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <DatasetTabSelect
          className={clsx('w-full rounded-lg border-gray-100 text-sm', {
            '!border-red-600 !ring-red-600': fieldState.invalid,
          })}
          datasetId={datasetId}
          enabled={!isEmpty(datasetId)}
          onChange={handleChange}
          placeholder={placeholder}
          value={field.value}
        />
      )}
    />
  )
}
