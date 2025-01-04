import React from 'react'
import { ITemplateContext } from 'util/narratives/interfaces'
const TemplateContext = React.createContext<ITemplateContext>({} as ITemplateContext)

export function connectToFormContext(Component: React.ComponentType<any>) {
  class WrappedWithFormContext extends React.Component<any> {
    static contextType = TemplateContext

    render() {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore context is not defined by the component
      return <Component {...this.props} {...this.context} />
    }
  }

  return WrappedWithFormContext
}

export default TemplateContext
