import { WidgetProps } from '@rjsf/core'
import BasicEditorWidget from 'components/shared/jawns/forms/BasicEditorWidget'
import React, { useEffect, useState } from 'react'

const MarkdownWidget: React.FC<WidgetProps> = (props) => {
  const [loaded, setLoaded] = useState(false)

  // FIXME - THIS IS A HACK
  // For some reason monaco does not load properly on initial render of DynamicForm
  useEffect(() => {
    setTimeout(() => {
      setLoaded(true)
    }, 500)
  }, [])

  if (!loaded) {
    return null
  }

  // convert BasicEditor onBlur args --> rjsf onBlur args
  const onBlurOverride = (value: string | undefined) => {
    props.onBlur && props.onBlur(props.id, value || null)
  }

  return <BasicEditorWidget language="markdown" {...props} onBlur={onBlurOverride} />
}

export default MarkdownWidget
