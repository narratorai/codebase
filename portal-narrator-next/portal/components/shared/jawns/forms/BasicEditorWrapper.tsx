import { Resizable } from 're-resizable'
import React, { useState } from 'react'
import Measure from 'react-measure'

interface Props {
  minHeight?: number
  defaultHeight?: number
  maxHeight?: number
  resizable?: boolean
  children: ({ editorHeight, editorWidth }: { editorHeight: number; editorWidth: number }) => React.ReactNode
}

/**
 * Wraps a basic editor to provide resizing
 *  1. properly reacts to parent resizing to resize the Monaco editor
 *  2. adds a bottom resize handle
 *    - can be disabled by setting resizable: false
 *
 * Note: 1. should probably be pushed down a level to the BasicEditor
 */
const BasicEditorWrapper = ({ children, minHeight = 30, defaultHeight = 320, resizable = true }: Props) => {
  const [editorHeight, setEditorHeight] = useState(defaultHeight)
  const [editorWidth, setEditorWidth] = useState(0)
  const [userHasResized, setUserHasResized] = useState(false)

  const resizeEnable = resizable ? { bottom: true } : {}

  return (
    <Measure
      bounds
      onResize={(contentRect) => {
        const height = contentRect.bounds ? contentRect.bounds.height : defaultHeight
        setEditorHeight(height)

        if (contentRect.bounds) {
          setEditorWidth(contentRect.bounds.width)
        }
      }}
    >
      {({ measureRef }) => {
        return (
          <div
            style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
            ref={measureRef}
            data-test="basic-editor-wrapper"
          >
            <Resizable
              style={{ flex: 1 }}
              defaultSize={{ height: minHeight, width: '100%' }}
              // keep minHeight set to default height until user manually drags it up/down
              minHeight={userHasResized ? minHeight : defaultHeight}
              enable={resizeEnable}
              onResize={(_, direction, ref) => {
                if (direction === 'bottom') {
                  setUserHasResized(true)
                  setEditorHeight(ref.offsetHeight)
                }
              }}
            >
              {children({ editorHeight, editorWidth })}
            </Resizable>
          </div>
        )
      }}
    </Measure>
  )
}

export default BasicEditorWrapper
