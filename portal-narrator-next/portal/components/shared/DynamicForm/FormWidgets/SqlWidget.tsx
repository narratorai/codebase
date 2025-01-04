import { BasicEditor } from '@narratorai/the-sequel'
import { WidgetProps } from '@rjsf/core'
import { BasicEditorWrapper } from 'components/shared/jawns'
import { useSqlAutocomplete } from 'components/shared/SqlEditor'
import { isNumber, toString } from 'lodash'
import { useEffect, useState } from 'react'

// VERY similar to components/shared/SqlEditor/SqlEditor
const SqlWidget = ({ disabled, onChange, options, value }: WidgetProps) => {
  const autocomplete = useSqlAutocomplete()
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

  const defaultHeight = isNumber(options.default_height) ? options.default_height : 320

  return (
    <BasicEditorWrapper defaultHeight={defaultHeight}>
      {({ editorHeight }) => (
        <BasicEditor
          language="redshift"
          autoComplete={autocomplete}
          height={editorHeight}
          value={value ? toString(value) : ''}
          onChange={onChange}
          disabled={disabled}
          changeOnBlurOnly
        />
      )}
    </BasicEditorWrapper>
  )
}

export default SqlWidget
