import { WidgetProps } from '@rjsf/core'
import BasicEditorWidget from 'components/shared/jawns/forms/BasicEditorWidget'
import { useEffect, useState } from 'react'

/**
 * JSON editor widget for Blocks
 *
 * Worth noting that options passed via ui:options in the UI Schema config will be
 * sent here as props.options. This is how autocompletion is done: ui:options { autocomplete: [...] }
 * which is picked up by the BasicEditorWidget
 */
const JsonWidget = (props: WidgetProps) => {
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
  const handleBlur = (value: string | undefined) => {
    props.onBlur?.(props.id, value || null)
  }

  return (
    <BasicEditorWidget
      language="json"
      {...props}
      onBlur={handleBlur}
      options={{ ...props.options, folding: true, lineNumbers: 'on' }}
    />
  )
}

export default JsonWidget
