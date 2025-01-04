import { SelectProps } from 'antd/es/select'
import { FormItem, SearchSelect } from 'components/antd/staged'
import { startCase } from 'lodash'
import { Field } from 'react-final-form'
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

interface TimeFilterKindSelectProps extends SelectProps<any> {
  fieldName: string
  rangeType: string
}

function TimeFilterKindSelect({ fieldName, rangeType, ...props }: TimeFilterKindSelectProps) {
  const options =
    rangeType === 'from'
      ? [{ label: 'the beginning of time', value: TIME_FILTER_KIND_BEGINNING }, ...sharedOptions]
      : [{ label: 'now', value: TIME_FILTER_KIND_NOW }, ...sharedOptions]

  return (
    <Field
      name={fieldName}
      validate={required}
      render={({ input, meta }) => (
        <FormItem noStyle meta={meta} required>
          <SearchSelect
            style={{ minWidth: 75 }}
            placeholder={startCase(rangeType)}
            options={options}
            popupMatchSelectWidth={false}
            {...input}
            {...props}
          />
        </FormItem>
      )}
    />
  )
}

export default TimeFilterKindSelect
