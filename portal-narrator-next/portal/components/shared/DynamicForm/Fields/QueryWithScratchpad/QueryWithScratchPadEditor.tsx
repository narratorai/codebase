import { Card } from 'antd-next'
import { Box } from 'components/shared/jawns'
import MarkdownEditor from 'components/shared/MarkdownEditor'
import { FunctionNoArgs, SqlEditor } from 'components/shared/SqlEditor'
import { IEditorComponentProps, StyledCodePanel } from 'components/shared/SqlEditor/EditorWithTable'
import { IQueryWithScratchpadValue } from 'components/shared/SqlEditor/services/interfaces'
import { get, merge } from 'lodash'
import { useEffect, useRef } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import styled from 'styled-components'
import { colors } from 'util/constants'

export const DEFAULT_SCRATCHPAD =
  'Capture markdown notes about the query here\n\n```sql\n\nSELECT *\nFROM \n\n```\n^ Write the SQL in here and press Cmd+Enter (Mac) or Ctrl+Enter (PC) to run\n\nType / to insert a new SQL code block\n\n'

const StyledPanelResizeHandle = styled(PanelResizeHandle)`
  border-right: 6px solid ${colors.gray200};
`

/**
 * Panel group container for the editor. Used to make sure the autocomplete menu is on top of
 * the table panel.
 */
const StyledPanelGroup = styled(PanelGroup)`
  overflow: visible !important;
`

interface Props extends IEditorComponentProps {
  readonly?: boolean
}

/**
 * This shows an editable query and scratchpad next to each other. For the purposes of being hosted inside
 * EditorWithTable this acts like a single editor
 */
// eslint-disable-next-line max-lines-per-function
const QueryWithScratchpadEditor = ({
  initialValue,
  runQuery,
  saveContents,
  getValueRef,
  getQueryRef,
  getFieldsRef,
  autoComplete,
  onEditorFocus,
  onEditorBlur,
  readonly,
}: Props) => {
  const loadedValue = initialValue as IQueryWithScratchpadValue

  // We have two query refs - one per editor. The single getValueRef
  // passed to this component will point to whichever one last had focus
  const sqlQueryRef = useRef<FunctionNoArgs | undefined>()
  const scratchpadQueryRef = useRef<FunctionNoArgs | undefined>()

  const sqlValueRef = useRef<FunctionNoArgs | undefined>()
  const scratchpadValueRef = useRef<FunctionNoArgs | undefined>()

  const editorInitialValue = get(loadedValue, 'current_query.sql')
  const scratchpadInitialValue = get(loadedValue, 'scratchpad.notes')

  const getValue = (): IQueryWithScratchpadValue => {
    let sqlValue,
      scratchpadValue = null

    if (sqlValueRef.current) {
      sqlValue = sqlValueRef.current()
    }

    if (scratchpadValueRef.current) {
      scratchpadValue = scratchpadValueRef.current()
    }

    return merge({}, loadedValue, {
      current_query: {
        sql: sqlValue,
      },
      scratchpad: {
        notes: scratchpadValue,
      },
    })
  }

  // getFields is called by the editor when executing a query
  // normally the backend has all the field definitions except the current query
  // which can change.
  const getFields = (): { current_script: string } => {
    let sqlValue = null

    if (sqlValueRef.current) {
      sqlValue = sqlValueRef.current()
    }

    return {
      current_script: sqlValue,
    }
  }

  if (getValueRef) {
    getValueRef.current = getValue
  }

  if (getFieldsRef) {
    getFieldsRef.current = getFields
  }

  const handleSave = () => {
    if (saveContents) {
      saveContents(getValue())
    }
  }

  // initialize getQueryRef to a value before the editor has been given focus
  useEffect(() => {
    if (getQueryRef && !getQueryRef.current && sqlQueryRef?.current) {
      getQueryRef.current = sqlQueryRef.current
    }
  }, [getQueryRef, sqlQueryRef])

  //
  // Note that either the sql editor or the markdown editor can run a query in the table
  //

  const cardBorder = readonly ? undefined : 'none'

  return (
    <Card size="small" style={{ height: '100%', border: cardBorder }} bodyStyle={{ height: '100%', padding: 0 }}>
      <StyledPanelGroup direction="horizontal" autoSaveId="sql-scratchpad-editor">
        <StyledCodePanel minSize={25}>
          <Box style={{ padding: 12, height: '100%' }}>
            <SqlEditor
              readonly={readonly}
              runQuery={runQuery}
              saveContents={handleSave}
              autoComplete={autoComplete}
              getQueryRef={sqlQueryRef}
              initialValue={editorInitialValue}
              getValueRef={sqlValueRef}
              onFocus={() => {
                if (getQueryRef) {
                  getQueryRef.current = sqlQueryRef.current
                }

                onEditorFocus?.()
              }}
              onBlur={onEditorBlur}
              width="100%"
              height="100%"
            />
          </Box>
        </StyledCodePanel>
        <StyledPanelResizeHandle onClick={(event) => event.stopPropagation()} />
        <Panel minSize={25}>
          <MarkdownEditor
            editorStyle={{ padding: 12 }}
            runQuery={runQuery}
            saveContents={handleSave}
            autoComplete={autoComplete}
            getQueryRef={scratchpadQueryRef}
            initialValue={scratchpadInitialValue}
            getValueRef={scratchpadValueRef}
            onFocus={() => {
              if (getQueryRef) {
                getQueryRef.current = scratchpadQueryRef.current
              }

              onEditorFocus?.()
            }}
            width="100%"
            initialIsEditing={!readonly}
            hideToggle
          />
        </Panel>
      </StyledPanelGroup>
    </Card>
  )
}

export default QueryWithScratchpadEditor
