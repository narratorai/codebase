import type { DatePickerProps } from 'react-datepicker'

export type IDateInputConfig = Partial<DatePickerProps> & {
  locale: string
  showTimeSelect: boolean
  showWeekPicker: boolean
  showMonthYearPicker: boolean
  showQuarterYearPicker: boolean
  showYearPicker: boolean
}

export enum InputType {
  Day = 'day',
  DayTime = 'dayTime',
  Week = 'week',
  Month = 'month',
  Quarter = 'quarter',
  Year = 'year',
}

export interface IAction {
  type: string
  payload?: InputType | unknown
}

export type IReducer = (state: IDateInputConfig, action: IAction) => IDateInputConfig

export interface IContext {
  configuration: IDateInputConfig
  inputType: InputType
  selectInputType: (value: InputType) => void
}
