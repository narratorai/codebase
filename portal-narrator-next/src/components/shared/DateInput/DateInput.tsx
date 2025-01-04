import { type DatePickerProps } from 'react-datepicker'

import Context from './Context'
import CustomDatePicker from './CustomDatePicker'
import { useDateInputConfig } from './hooks'

const DateInput = (props: DatePickerProps) => {
  const { configuration, inputType, selectInputType } = useDateInputConfig()

  return (
    <Context.Provider value={{ configuration, inputType, selectInputType }}>
      <CustomDatePicker {...props} />
    </Context.Provider>
  )
}

export default DateInput
