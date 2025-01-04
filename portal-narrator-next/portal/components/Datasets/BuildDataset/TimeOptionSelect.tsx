import { FormItem, SearchSelect } from 'components/antd/staged'
import { isEmpty } from 'lodash'
import { useEffect } from 'react'
import { Field, useField } from 'react-final-form'
import { required } from 'util/forms'

const TIME_OPTION_FIELDNAME = 'time_option_id'

interface Props {
  timeToConvertOptions: { label: string; value: string }[]
}

const TimeOptionSelect = ({ timeToConvertOptions }: Props) => {
  const {
    input: { value: timeOptionValue, onChange: timeOptionOnChange },
  } = useField(TIME_OPTION_FIELDNAME, { subscription: { value: true } })

  // when the time option is shown
  // select the first time option as intial value
  useEffect(() => {
    if (timeToConvertOptions && !isEmpty(timeToConvertOptions) && isEmpty(timeOptionValue)) {
      timeOptionOnChange(timeToConvertOptions[0]?.value)
    }
  }, [timeToConvertOptions, timeOptionValue, timeOptionOnChange])

  return (
    <Field
      name={TIME_OPTION_FIELDNAME}
      validate={required}
      render={({ input, meta }) => (
        <FormItem meta={meta} label="Time to Convert" labelCol={{ span: 6, offset: 3 }} required>
          <SearchSelect options={timeToConvertOptions} {...input} />
        </FormItem>
      )}
    />
  )
}

export default TimeOptionSelect
