import { SearchSelect } from 'components/antd/staged'
import { useEffect } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

const DOES_EXIST_COLUMN_TYPE_OPTIONS = [
  { label: 'Did (1)', value: 1 },
  { label: 'Did Not (0)', value: 0 },
]

interface Props {
  fieldName: string
}

const DoesExistColumnFilter = ({ fieldName }: Props) => {
  const { control, watch, setValue } = useFormContext()
  const filterValue = watch(fieldName)

  // set default value 1
  useEffect(() => {
    if (filterValue !== 1 && filterValue !== 0) {
      setValue(fieldName, 1)
    }
  }, [filterValue, setValue, fieldName])

  return (
    <Controller
      control={control}
      name={fieldName}
      render={({ field }) => (
        <SearchSelect
          {...field}
          options={DOES_EXIST_COLUMN_TYPE_OPTIONS}
          popupMatchSelectWidth={false}
          style={{ minWidth: '96px' }}
        />
      )}
    />
  )
}

export default DoesExistColumnFilter
