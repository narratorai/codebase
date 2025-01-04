import { WidgetProps } from '@rjsf/core'
import MarkdownRenderer from 'components/shared/MarkdownRenderer'
import React from 'react'

// This isn't quite a widget as it doesn't allow the user to edit it, but it allows
// Mavis to use input values effectively as formatted help text:
const MarkdownRenderWidget: React.FC<WidgetProps> = ({ value }) => {
  return <MarkdownRenderer source={value} />
}

export default MarkdownRenderWidget
