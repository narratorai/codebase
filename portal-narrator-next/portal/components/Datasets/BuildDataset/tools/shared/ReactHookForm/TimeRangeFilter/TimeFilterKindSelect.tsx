import { SelectProps } from 'antd/es/select'
import { FormItem, SearchSelect } from 'components/antd/staged'
import _ from 'lodash'
import { Controller, useFormContext } from 'react-hook-form'
import {
  TIME_FILTER_KIND_ABSOLUTE,
  TIME_FILTER_KIND_BEGINNING,
  TIME_FILTER_KIND_COLLOQUIAL,
  TIME_FILTER_KIND_NOW,
  TIME_FILTER_KIND_RELATIVE,
} from 'util/datasets'
import { required } from 'util/forms'

const sharedOptions = [
  {
    label: 'the beginning of...',
    value: TIME_FILTER_KIND_COLLOQUIAL,
  },
  {
    label: 'a specific time...',
    value: TIME_FILTER_KIND_ABSOLUTE,
  },
  {
    label: 'a relative time...',
    value: TIME_FILTER_KIND_RELATIVE,
  },
]

interface Props extends SelectProps<any> {
  fieldName: string
  rangeType: string
}

function TimeFilterKindSelect({ fieldName, rangeType, ...props }: Props) {
  const { control } = useFormContext()

  const options =
    rangeType === 'from'
      ? [{ label: 'the beginning of time', value: TIME_FILTER_KIND_BEGINNING }, ...sharedOptions]
      : [{ label: 'now', value: TIME_FILTER_KIND_NOW }, ...sharedOptions]

  return (
    <Controller
      name={fieldName}
      shouldUnregister
      control={control}
      rules={{ validate: required }}
      render={({ field, fieldState: { isTouched: touched, error } }) => (
        <FormItem noStyle meta={{ touched, error: error?.message }}>
          <SearchSelect
            style={{ minWidth: 75 }}
            placeholder={_.startCase(rangeType)}
            options={options}
            popupMatchSelectWidth={false}
            {...field}
            {...props}
          />
        </FormItem>
      )}
    />
  )
}

export default TimeFilterKindSelect
