import { SqlEditorProps } from '@narratorai/the-sequel/dist/components/SqlEditor/SqlEditor'
import { RadioChangeEvent } from 'antd/lib/radio'
import { Radio } from 'antd-next'
import { Box, Flex } from 'components/shared/jawns'
import MarkdownRenderer from 'components/shared/MarkdownRenderer'
import React, { lazy, MutableRefObject, Suspense, useCallback, useEffect, useRef, useState } from 'react'

const EDIT_TOGGLE_HEIGHT = 56

//
// Markdown Editor that can show a preview automatically and automatically supports inline SQL
//

const LazyBasicEditor = lazy(async () => {
  const { BasicEditor } = await import(/* webpackChunkName: "the-sequel" */ '@narratorai/the-sequel')
  // Have to return under the default key to keep lazy happy
  return { default: BasicEditor }
})

const LazyMarkdownSqlEditor = lazy(async () => {
  const { MarkdownSqlEditor } = await import(/* webpackChunkName: "the-sequel" */ '@narratorai/the-sequel')
  // Have to return under the default key to keep lazy happy
  return { default: MarkdownSqlEditor }
})

interface MarkdownEditorProps extends Omit<SqlEditorProps, 'runQuery'> {
  initialIsEditing?: boolean // starts off in preview or editing?
  onToggle?: (isEditing: boolean, value: string) => void
  runQuery?(sql: string): void // set this also switches to a markdown editor that can run SQL
  editorStyle?: object
  resetValueRef?: MutableRefObject<ResetValueFunction | undefined> // call this to reset the value in the editor
  hideToggle?: boolean
  onBlur?: (value: string) => void
}

export type ResetValueFunction = (newValue?: string) => void

// Context to pass down a run sql function to the markdown renderer -- allows running sql when not editing Markdown
export interface IRunSqlContext {
  runQuery?: (sql: string) => void
}
export const RunSqlContext = React.createContext<IRunSqlContext>({})

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  initialIsEditing = false,
  initialValue,
  onToggle,
  editorStyle,
  runQuery,
  resetValueRef,
  hideToggle = false,
  getValueRef,
  onBlur,
  ...props
}) => {
  // Note: BasicEditor is a controlled component and uses value / onChanged to maintain state.
  //       MarkdownSqlEditor is not. So we use two different ways to manage the editors
  //       We only really need to 'know' the value of the editor when we toggle.
  //       getSqlEditorValue() provides the value of the MarkdownSqlEditor.

  const [value, setValue] = useState('')
  const valueRef = useRef<(() => string) | undefined>()

  const [isEditing, setIsEditing] = useState(initialIsEditing)
  const isSqlEditing = !!runQuery

  //
  // Managing editor value
  //

  // All the cases that getValue has to handle
  //  if we use a MarkdownSqlEditor, which uses getValueRef, then send down a ref to get the value
  //  if the editor is a controlled component (BasicEditor and MarkdownRenderer) then use onChanged and state to track the value
  // In both cases: the parent can send down a getValueRef that should point to a function returning the current value

  // if initial value changes we'll have to reset value
  useEffect(() => {
    if (initialValue) {
      setValue(initialValue)
    }
  }, [initialValue])

  const handleOnChange = useCallback((value: string) => {
    setValue(value)
  }, [])

  // If a parent passes down a getValueRef we can just use it to get the current
  // value. If not we'll define our own ref to use
  const getValue = useCallback(() => {
    if (valueRef.current && valueRef.current()) {
      return valueRef.current()
    }

    return value
  }, [value])

  if (getValueRef) {
    getValueRef.current = getValue
  }

  //
  // Toggle
  //

  const handleRadioChange = useCallback(
    (e: RadioChangeEvent) => {
      const mode = e.target.value
      const newIsEditing = mode === 'edit'

      const currentValue = getValue()
      if (isSqlEditing) {
        setValue(currentValue)
      }

      setIsEditing(newIsEditing)
      onToggle && onToggle(newIsEditing, currentValue)
    },
    [getValue, isSqlEditing, onToggle]
  )

  //
  // Reset
  //

  const resetEditorValue = (newValue?: string) => {
    setValue(newValue || '')
    // TODO: reset isn't implemented when using the markdown SQL editor
    //       It's possible to do, but slightly annoying, so left until we need it
  }

  if (resetValueRef) {
    resetValueRef.current = resetEditorValue
  }

  return (
    <Flex flexDirection="column" justifyContent="stretch" style={{ height: '100%' }}>
      {!hideToggle && (
        <Flex justifyContent="center" alignItems="center" style={{ height: EDIT_TOGGLE_HEIGHT }}>
          <Radio.Group
            onChange={handleRadioChange}
            value={isEditing ? 'edit' : 'view'}
            size="small"
            buttonStyle="solid"
          >
            <Radio.Button value="view">View</Radio.Button>
            <Radio.Button value="edit">Edit</Radio.Button>
          </Radio.Group>
        </Flex>
      )}
      <Box flexGrow={1} style={{ ...editorStyle, height: `calc(100% - ${EDIT_TOGGLE_HEIGHT}px)` }}>
        {isEditing ? (
          isSqlEditing ? (
            <Suspense fallback={null}>
              <LazyMarkdownSqlEditor
                initialValue={value || initialValue}
                runQuery={runQuery}
                onBlur={onBlur}
                {...props}
                height="100%"
                getValueRef={valueRef}
                options={{ wordWrap: 'on' }}
              />
            </Suspense>
          ) : (
            <Suspense fallback={null}>
              <LazyBasicEditor
                language="markdown"
                onChange={handleOnChange}
                value={value}
                height="100%"
                onBlur={onBlur}
                options={{
                  lineNumbers: 'off',
                  wordWrap: 'on',
                }}
              />
            </Suspense>
          )
        ) : (
          // padding here is to match the default padding used by the Monaco editor (i.e BasicEditor)
          <Box px={2} style={{ height: '100%', overflowY: 'auto' }}>
            <RunSqlContext.Provider value={{ runQuery: runQuery }}>
              <MarkdownRenderer source={value} />
            </RunSqlContext.Provider>
          </Box>
        )}
      </Box>
    </Flex>
  )
}

export default MarkdownEditor
