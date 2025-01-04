import { SqlEditor as LibrarySqlEditor } from '@narratorai/the-sequel'
import { SqlEditorProps as LibrarySqlProps } from '@narratorai/the-sequel/dist/components/SqlEditor/SqlEditor'
import { Box } from 'components/shared/jawns'
import { get } from 'lodash'

import { FunctionRef } from '.'
import SqlRenderer from './SqlRenderer'

export const READONLY_MAX_HEIGHT = '80vh'

interface Props extends LibrarySqlProps {
  readonly?: boolean
  editorContext?: object
  getFieldsRef?: FunctionRef
}

/**
 * Thin wrapper around the basic SqlEditor component that supports
 * a readonly view and knows about fields
 */
const SqlEditor = ({ readonly, initialValue, editorContext, getFieldsRef, ...props }: Props) => {
  // The EditorWithTable asks its EditorComponent if it has any fields to send down when doing runQuery on the backend.
  // The SqlWithTableWidget used in transformations has some fields which it puts in the editorContext
  const getFields = () => {
    return get(editorContext, 'fields', null)
  }

  if (getFieldsRef) {
    getFieldsRef.current = getFields
  }

  if (readonly) {
    return (
      // the mr="4px" is a hack to give space to the vertical scrollbar -- not sure why it's needed unfortunately
      <Box mr="4px" style={{ overflow: 'auto' }} data-test="read-only-sql-editor">
        <SqlRenderer source={initialValue} />
      </Box>
    )
  }

  return <LibrarySqlEditor initialValue={initialValue} {...props} />
}

export default SqlEditor
