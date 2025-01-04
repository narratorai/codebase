import { isString } from 'lodash'
import { useEffect, useState } from 'react'

import BasicEditorField from './BasicEditorField'

const JsonField = ({ value, ...props }) => {
  const [loaded, setLoaded] = useState(false)
  const stringifiedValue = isString(value) ? value : JSON.stringify(value, (_k, v) => v || undefined, 4)

  // FIXME: issue with lazy loading Monaco
  // Force re-render on load so Monaco expands all values in JSON
  useEffect(() => {
    setTimeout(() => {
      setLoaded(true)
    }, 100)
  }, [])

  if (!loaded) {
    return null
  }

  return (
    <BasicEditorField
      language={'json'}
      value={stringifiedValue}
      options={{ folding: true, lineNumbers: 'on' }}
      {...props}
    />
  )
}

export default JsonField
