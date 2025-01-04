import clsx from 'clsx'
import { isEmpty } from 'lodash'
import { Controller, useFormContext } from 'react-hook-form'

import DatasetColumnSelect from './DatasetColumnSelect'

interface Props {
  datasetId: string
  datasetTabSlug: string
  name: string
  placeholder?: string
}

export default function DatasetColumnSelectController({ datasetId, datasetTabSlug, name, placeholder }: Props) {
  const { control } = useFormContext()

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <DatasetColumnSelect
          className={clsx('w-full rounded-lg border-gray-100 text-sm', {
            '!border-red-600 !ring-red-600': fieldState.invalid,
          })}
          datasetId={datasetId}
          datasetTabSlug={datasetTabSlug}
          enabled={!isEmpty(datasetId) && !isEmpty(datasetTabSlug)}
          onChange={field.onChange}
          placeholder={placeholder}
          value={field.value}
        />
      )}
    />
  )
}
