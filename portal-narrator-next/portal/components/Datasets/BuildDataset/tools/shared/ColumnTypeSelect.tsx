import { FormItem, SearchSelect } from 'components/antd/staged'
import { includes, isEmpty, map } from 'lodash'
import { useEffect } from 'react'
import { Controller, useFormContext, useFormState } from 'react-hook-form'
import {
  COLUMN_TYPE_BOOLEAN,
  COLUMN_TYPE_COLUMN_ID,
  COLUMN_TYPE_NULL,
  COLUMN_TYPE_NUMBER,
  COLUMN_TYPE_STRING,
  COLUMN_TYPE_TIMESTAMP,
} from 'util/datasets'
import { required } from 'util/forms'

const DEFAULT_OPTIONS = [
  {
    label: 'Boolean',
    value: COLUMN_TYPE_BOOLEAN,
  },
  {
    label: 'Number',
    value: COLUMN_TYPE_NUMBER,
  },
  {
    label: 'String',
    value: COLUMN_TYPE_STRING,
  },
  {
    label: 'Timestamp',
    value: COLUMN_TYPE_TIMESTAMP,
  },
  {
    label: 'Null',
    value: COLUMN_TYPE_NULL,
  },
]

interface Props {
  fieldName: string
  withColumnIdOption?: boolean
  defaultValue?: string
}

const ColumnTypeSelect = ({ fieldName, withColumnIdOption = false, defaultValue }: Props) => {
  const { errors } = useFormState()
  const iftttTypeError = errors?.iftttOutputTypesMismatch

  const { watch, setValue, control } = useFormContext()

  const selectValue = watch(fieldName)
  const selectOnChange = (value: string) => setValue(fieldName, value)

  const options = withColumnIdOption
    ? [
        ...DEFAULT_OPTIONS,
        {
          label: 'Column Value',
          value: COLUMN_TYPE_COLUMN_ID,
        },
      ]
    : DEFAULT_OPTIONS

  useEffect(() => {
    // if given a defaultValue and no value has been set
    if (defaultValue && isEmpty(selectValue)) {
      // make sure the default value is included in the available options
      const optionValues = map(options, (op) => op.value)
      if (includes(optionValues, defaultValue)) {
        // if it is a eligible value, set it
        selectOnChange(defaultValue)
      }
    }
  }, [defaultValue, selectValue, selectOnChange, options])

  return (
    <Controller
      rules={{
        validate: (v) => required(v),
      }}
      control={control}
      name={fieldName}
      render={({ field, fieldState: { isTouched, error } }) => {
        // forcing touched true if there is a type error
        // errors only show if touched and we want to show errors
        // on all column types if even one doesn't match)
        const touched = !!error || !!iftttTypeError?.message || isTouched

        return (
          <FormItem
            label="Value type"
            meta={{ touched, error: error?.message || iftttTypeError?.message }}
            required
            layout="vertical"
            data-test="column-type-select"
          >
            <SearchSelect options={options} {...field} />
          </FormItem>
        )
      }}
    />
  )
}

export default ColumnTypeSelect
