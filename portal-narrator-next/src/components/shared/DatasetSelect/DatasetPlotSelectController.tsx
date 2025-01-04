import clsx from 'clsx'
import { isEmpty } from 'lodash'
import { Controller, useFormContext } from 'react-hook-form'

import DatasetPlotSelect from './DatasetPlotSelect'

export type OnChangeContext = {
  tab: {
    slug?: string
    plot: { slug: string }
  }
}

interface Props {
  datasetId: string
  name: string
  onChange?: (value: string, context: OnChangeContext) => void
  placeholder?: string
}

export default function DatasetPlotSelectController({ datasetId, name, placeholder, onChange }: Props) {
  const { control, setValue } = useFormContext()

  const handleChange = (plotSlug: string, datasetTabSlug?: string) => {
    setValue(name, plotSlug)

    onChange?.(plotSlug, {
      tab: {
        slug: datasetTabSlug,
        plot: { slug: plotSlug },
      },
    })
  }

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <DatasetPlotSelect
          className={clsx('w-full rounded-lg border-gray-100 p-2 text-sm', {
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
