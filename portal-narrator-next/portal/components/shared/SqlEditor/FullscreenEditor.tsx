import { CompressOutlined } from '@ant-design/icons'
import { IAutocomplete } from '@narratorai/the-sequel'
import { Button, Tooltip } from 'antd-next'
import DataTable from 'components/shared/DataTable/DataTable'
import { Box, Flex, Typography } from 'components/shared/jawns'
import React, { useCallback, useEffect, useState } from 'react'
import styled, { css } from 'styled-components'
import { colors } from 'util/constants'
import useKeyPress from 'util/useKeyPress'

import { FunctionRef } from '.'
import EditorWithTable, { IEditorComponentProps } from './EditorWithTable'
import SchemaMiniMap from './SchemaMiniMap'
import useQueryService from './services/useQueryService'

const EditorModal = styled(Box)<{ editorEditing?: boolean }>`
  height: 100%;
  width: 100%;

  ${({ editorEditing }) =>
    editorEditing &&
    css`
      width: 100%;
      position: fixed;
      inset: 0;
      background-color: rgb(0 0 0 / 20%);
      z-index: 1;
    `}
`

// A custom implementation of a "Drawer" (vs using the antd one), because
// the antd version grabs "focus" when the drawer is opened and we don't want that.
// We want the editor (Sql or Scratchpad) to have focus. Unfortunately, there is
// no way to tell rc-drawer (lib that powers antd's Drawer) not to grab focus
const SchemaDrawer = styled(Box)<{ editorEditing?: boolean }>`
  transform: translateX(100%);
  width: 0;
  height: 0;
  overflow: hidden;
  border-right: 1px solid ${colors.gray200};
  border-top-left-radius: 5px;
  border-bottom-left-radius: 5px;

  ${({ editorEditing }) =>
    editorEditing &&
    css`
      box-shadow: rgb(0 0 0 / 20%) -5px 6px 15px -9px;
      width: 310px !important;
      min-width: 310px !important;
      height: 100% !important;
      background-color: ${({ theme }) => theme.colors.white};
      transform: translateX(0);

      /* matching values from https://github.com/ant-design/ant-design/blob/master/components/style/themes/default.less#L118 */

      /* which are used in antd Drawer (https://github.com/ant-design/ant-design/blob/master/components/drawer/style/drawer.less) */
      transition: transform 0.3s cubic-bezier(0.7, 0.3, 0.1, 1);
    `}
`

interface Props {
  EditorComponent: React.FC<IEditorComponentProps>
  autoComplete: IAutocomplete
  getValueRef?: FunctionRef
  initialEditorData?: any
  onEditorSave?(value: any): void
  onOpen?(): void
  onClose?(): void
  editorContext?: object
  editorProps?: object
}

/**
 * This component will render a readonly sql editor that when clicked on opens
 * to a full screen editor with a schema tree, editor, and data table
 *
 * Used by Blocks through QueryWithScratchpadField and SqlEditorWidget
 */
const FullscreenEditor = ({
  EditorComponent,
  autoComplete,
  getValueRef,
  initialEditorData,
  onEditorSave,
  onOpen,
  onClose,
  editorContext,
  editorProps,
}: Props) => {
  const queryService = useQueryService()
  const [editorEditing, setEditorEditingImpl] = useState(false)

  // we want to render the schema map the first time the component is opened and then keep it alive
  const [showSchemaMap, setShowSchemaMap] = useState(false)

  // we listen for Escape key so we can close
  // the schema mini map
  const escapePressed = useKeyPress('Escape')

  const setEditorEditing = useCallback(
    (editing: boolean) => {
      if (!editing) {
        onClose && onClose()
      }
      setEditorEditingImpl(editing)
    },
    [onClose]
  )

  const handleFocus = useCallback(() => {
    setEditorEditing(true)
  }, [setEditorEditing])

  // handle user hitting Escape key to close
  // the schema map sider nav
  useEffect(() => {
    if (escapePressed) {
      setEditorEditing(false)
    }
  }, [escapePressed, setEditorEditing])

  useEffect(() => {
    if (editorEditing) {
      setShowSchemaMap(true)
      onOpen && onOpen()
    }
  }, [editorEditing, onOpen])

  if (!queryService) {
    return null
  }

  return (
    <EditorModal editorEditing={editorEditing}>
      <Flex style={{ height: '100%' }}>
        {editorEditing && (
          <div className="mask" aria-hidden="true" onClick={() => setEditorEditing(false)} style={{ width: '100px' }} />
        )}

        <SchemaDrawer editorEditing={editorEditing}>
          {showSchemaMap && (
            <Flex flexDirection="column" style={{ height: '100%' }}>
              <Box p={3}>
                <Flex alignItems="center" justifyContent="space-between" data-public>
                  <Typography type="title300" mr={2}>
                    Query Editor
                  </Typography>
                  <Tooltip placement="bottomLeft" title="Exit full-screen mode">
                    <Button
                      danger
                      icon={<CompressOutlined />}
                      size="small"
                      onClick={() => setEditorEditing(false)}
                      data-test="exit-full-screen-editor-button"
                    >
                      Exit
                    </Button>
                  </Tooltip>
                </Flex>
              </Box>

              {queryService && (
                <Box flexGrow={1} p={3} pt={0} style={{ minHeight: 0, height: '100%' }}>
                  <SchemaMiniMap getSchemas={queryService.getSchemas} />
                </Box>
              )}
            </Flex>
          )}
        </SchemaDrawer>

        <Box flexGrow={1}>
          {editorEditing ? (
            <EditorWithTable
              autoComplete={autoComplete}
              service={queryService}
              EditorComponent={EditorComponent}
              TableComponent={DataTable}
              onEditorSave={onEditorSave}
              onEditorFocus={handleFocus}
              initialEditorData={initialEditorData}
              getValueRef={getValueRef}
              editorContext={editorContext}
              editorProps={editorProps}
            />
          ) : (
            <Box onClick={handleFocus}>
              <EditorComponent readonly getValueRef={getValueRef} initialValue={initialEditorData} />
            </Box>
          )}
        </Box>
      </Flex>
    </EditorModal>
  )
}

export default FullscreenEditor
