import { createContext } from 'react'

import { DEFAULT_DATE_INPUT_CONFIG } from './constants'
import { IContext, IDateInputConfig, InputType } from './interfaces'

const Context = createContext<IContext>({
  configuration: { ...DEFAULT_DATE_INPUT_CONFIG } as IDateInputConfig,
  inputType: InputType.Day,
  selectInputType: () => {},
})

export default Context
