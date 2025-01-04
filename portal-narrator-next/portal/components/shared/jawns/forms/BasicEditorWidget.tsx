import { BasicEditor, IAutocomplete, IBasicCompletionDefinition } from '@narratorai/the-sequel'
import { antdOverrides } from '@narratorai/theme'
import { Alert } from 'antd-next'
import { BasicEditorWrapper, Box } from 'components/shared/jawns'
import { cloneDeep, isBoolean, isNumber, omit, toString } from 'lodash'
import { ErrorInfo, useEffect, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { useInView } from 'react-intersection-observer'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown'
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism'
import styled from 'styled-components'
import { reportError } from 'util/errors'

SyntaxHighlighter.registerLanguage('md', markdown)

// A basic text editor input that we use mostly for Markdown and JSON
// Has autocomplete, resizing, our input styling, and some default options

const narratorMd = cloneDeep(vs)
const selector = 'code[class*="language-"]'

narratorMd[selector]['fontFamily'] = 'Menlo, Monaco,"Courier New", monospace'
narratorMd[selector]['fontSize'] = '13px'
narratorMd[selector]['lineHeight'] = '1.55'
narratorMd[selector]['color'] = '#000'
narratorMd[selector]['wordBreak'] = 'break-word'

// Wrap Monaco inputs so they look like antd form inputs
// the class .ant-input has too many styles specific to <input>
// - add border color when there's an error (red) or default (gray)
// - add border-radius to match .ant-input
const StyledInputWrapper = styled.div<{ hasError?: boolean }>`
  width: 100%;
  height: 100%;
  padding: 1px 0;

  /* @border-color-base: https://github.com/ant-design/ant-design/blob/master/components/style/themes/default.less#L134 */
  border: 1px solid ${({ hasError }) => (hasError ? '#cc504b' : '#d9d9d9')};
  border-radius: ${antdOverrides['@border-radius-base']};
  background-color: white;
`

export interface BasicEditorWidgetProps {
  language: string
  disabled?: boolean
  onChange: (value: string | undefined) => void
  options: {
    lazy?: boolean
    default_height?: number
    autocomplete?: IBasicCompletionDefinition[] | IAutocomplete
    resizable?: boolean
    changeOnBlurOnly?: boolean
    folding?: boolean
    lineNumbers?: 'on' | 'off' | 'relative' | 'interval' | ((lineNumber: number) => string)
  }
  value?: string
  hasError?: boolean

  // NOTE: jsonschema form and react final form have different args
  // rjsf: (id: string, value: any)
  // react-final-form: (?SyntheticFocusEvent<*>)
  onBlur?: (value: any) => void
}

const BasicEditorWidget = ({
  language,
  disabled,
  onChange,
  onBlur,
  options,
  value,
  hasError,
}: BasicEditorWidgetProps) => {
  const lazyEnabled = options.lazy
  const stringifiedValue = value ? toString(value) : ''

  const [editing, setEditing] = useState(!lazyEnabled)

  // use this intersection-observer to mount/unmount
  // the Monaco editor when they enter/leave the viewport
  // Note: disabled (skip) if `options.lazy` is false (default)
  const [inViewRef, inView] = useInView({
    skip: !lazyEnabled,
    rootMargin: '200px 0px 200px 0px',
  })

  const defaultHeight = isNumber(options?.default_height) ? options?.default_height : 240
  const resizable = isBoolean(options?.resizable) ? options.resizable : true

  const reportEditorError = (err: Error, info: ErrorInfo) => {
    reportError(err, null, {
      boundary: 'basic-editor',
      componentStack: info.componentStack,
    })
  }

  // if in "editing" mode, but the component is no longer "in view",
  // we set editing to false to unmount Monaco editor
  useEffect(() => {
    if (lazyEnabled && editing && !inView) {
      setEditing(false)
    }
  }, [lazyEnabled, editing, inView])

  return (
    <ErrorBoundary
      onError={reportEditorError}
      fallbackRender={({ error }) => <Alert message="Unable to load editor" description={error} type="error" />}
    >
      <StyledInputWrapper
        ref={inViewRef}
        hasError={hasError}
        onMouseEnter={() => lazyEnabled && !editing && setEditing(true)}
      >
        <BasicEditorWrapper defaultHeight={defaultHeight} resizable={resizable}>
          {({ editorHeight, editorWidth }) => {
            return editing ? (
              <BasicEditor
                language={language}
                height={editorHeight}
                width={editorWidth}
                value={stringifiedValue}
                onBlur={onBlur}
                onChange={onChange}
                disabled={disabled}
                autoComplete={options?.autocomplete as IBasicCompletionDefinition[]}
                changeOnBlurOnly={options?.changeOnBlurOnly}
                options={{
                  lineNumbers: 'off',
                  wordWrap: 'on',
                  ...omit(options, 'default_height', 'autocomplete'),
                }}
              />
            ) : (
              <Box style={{ height: '100%', overflow: 'auto' }}>
                <SyntaxHighlighter
                  language={'md'}
                  wrapLongLines
                  style={narratorMd}
                  customStyle={{
                    border: 'none',
                    margin: '0 16px 0 10px',
                    padding: 0,
                    fontSize: 13,
                  }}
                >
                  {stringifiedValue}
                </SyntaxHighlighter>
              </Box>
            )
          }}
        </BasicEditorWrapper>
      </StyledInputWrapper>
    </ErrorBoundary>
  )
}

export default BasicEditorWidget
