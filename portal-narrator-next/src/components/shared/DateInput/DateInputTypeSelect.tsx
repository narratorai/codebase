import { useContext } from 'react'

import Context from './Context'
import DateInputTypeSelectOption from './DateInputTypeSelectOption'
import { InputType } from './interfaces'

const DateInputTypeSelect = () => {
  const { inputType, selectInputType } = useContext(Context)

  return (
    <div className="gap-1 px-6 py-4 flex-y">
      <DateInputTypeSelectOption
        value={InputType.Day}
        label="Day"
        selectedValue={inputType}
        onClick={selectInputType}
      />
      <DateInputTypeSelectOption
        value={InputType.DayTime}
        label="Day & Time"
        selectedValue={inputType}
        onClick={selectInputType}
      />
      <DateInputTypeSelectOption
        value={InputType.Week}
        label="Week"
        selectedValue={inputType}
        onClick={selectInputType}
      />
      <DateInputTypeSelectOption
        value={InputType.Month}
        label="Month"
        selectedValue={inputType}
        onClick={selectInputType}
      />
      <DateInputTypeSelectOption
        value={InputType.Quarter}
        label="Quarter"
        selectedValue={inputType}
        onClick={selectInputType}
      />
      <DateInputTypeSelectOption
        value={InputType.Year}
        label="Year"
        selectedValue={inputType}
        onClick={selectInputType}
      />
    </div>
  )
}

export default DateInputTypeSelect
