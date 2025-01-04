import { useReducer, useState } from 'react'
import { registerLocale } from 'react-datepicker'

import { getLocale, getLocalOptions } from '@/util/formatters'

import { DEFAULT_DATE_INPUT_CONFIG } from '../constants'
import { IContext, IDateInputConfig, InputType, IReducer } from '../interfaces'

const getRegisteredLocale = () => {
  const { locale } = getLocalOptions()
  registerLocale(locale, getLocale(locale))
  return locale
}

const selectInputTypeReducer = (inputType: InputType) => {
  switch (inputType) {
    case InputType.Day:
      return { ...DEFAULT_DATE_INPUT_CONFIG } as IDateInputConfig
    case InputType.DayTime:
      return { ...DEFAULT_DATE_INPUT_CONFIG, showTimeSelect: true } as IDateInputConfig
    case InputType.Week:
      return { ...DEFAULT_DATE_INPUT_CONFIG, showWeekPicker: true } as IDateInputConfig
    case InputType.Month:
      return { ...DEFAULT_DATE_INPUT_CONFIG, showMonthYearPicker: true } as IDateInputConfig
    case InputType.Quarter:
      return { ...DEFAULT_DATE_INPUT_CONFIG, showQuarterYearPicker: true } as IDateInputConfig
    case InputType.Year:
      return { ...DEFAULT_DATE_INPUT_CONFIG, showYearPicker: true } as IDateInputConfig
    default:
      return { ...DEFAULT_DATE_INPUT_CONFIG } as IDateInputConfig
  }
}

const reducer: IReducer = (state, action) => {
  switch (action.type) {
    case 'selectInputType':
      return selectInputTypeReducer(action.payload as InputType)
    default:
      return { ...DEFAULT_DATE_INPUT_CONFIG } as IDateInputConfig
  }
}

const useDateInputConfig = (): IContext => {
  const [configuration, dispatch] = useReducer<IReducer>(reducer, {
    ...DEFAULT_DATE_INPUT_CONFIG,
    showTimeSelect: true,
  } as IDateInputConfig)

  const locale = getRegisteredLocale()

  const [inputType, setInputType] = useState<InputType>(InputType.DayTime)

  const selectInputType = (value: InputType) => {
    setInputType(value)
    dispatch({ type: 'selectInputType', payload: value })
  }

  return {
    configuration: { ...configuration, locale },
    inputType,
    selectInputType,
  }
}

export default useDateInputConfig
