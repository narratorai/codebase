import React, { createContext } from 'react'
import { IDatasetFormContext } from 'util/datasets/interfaces'

const DatasetFormContext = createContext<IDatasetFormContext>({} as IDatasetFormContext)

export function connectToFormContext(Component: React.ComponentType<any>) {
  class WrappedWithFormContext extends React.Component<any> {
    static contextType = DatasetFormContext

    render() {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore context is not defined by the component
      return <Component {...this.props} {...this.context} />
    }
  }

  return WrappedWithFormContext
}

export default DatasetFormContext
