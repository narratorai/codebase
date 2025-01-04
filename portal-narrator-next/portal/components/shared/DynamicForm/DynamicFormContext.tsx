import { IDynamicFormContext } from 'components/shared/DynamicForm/interfaces'
import React from 'react'

const DynamicFormContext = React.createContext<IDynamicFormContext>({} as IDynamicFormContext)

export default DynamicFormContext
