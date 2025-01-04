import { InputType } from './interfaces'
import MonthNavigationHeader from './MonthNavigationHeader'
import YearNavigationHeader from './YearNavigationHeader'

/**
 * This function is used in the CustomDatePicker.
 * The reason for this approach is because Header Components must be pure functions.
 * This prevents us from using useContext to retrieve inputType, like in other places of the component,
 * and decide which header version to use.
 */
const getHeader = (inputType: InputType) => {
  const ifInputTypeIsMonthOrQuarter = inputType === InputType.Month || inputType === InputType.Quarter

  return ifInputTypeIsMonthOrQuarter ? YearNavigationHeader : MonthNavigationHeader
}

export default getHeader
