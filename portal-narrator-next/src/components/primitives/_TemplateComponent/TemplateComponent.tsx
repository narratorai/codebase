import React from 'react'

type Props = Omit<React.ComponentPropsWithoutRef<'div'>, 'className'>

const TemplateComponent = (props: Props) => <div {...props} className="rounded-md bg-gray-100 px-6 py-4" />

export default TemplateComponent
