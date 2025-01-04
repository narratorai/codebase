import { NodeViewProps, NodeViewWrapper } from '@tiptap/react'
import { isEmpty } from 'lodash'
import { useToggle } from 'react-use'

import EditableNodeViewWrapper from '../../shared/EditableNodeViewWrapper'
import ResizableNodeContentContainer from '../../shared/ResizableNodeContentContainer'
import { DataTableFormData } from './DataTableForm'
import DataTableNodeContent from './DataTableNodeContent'
import DataTableNodePlaceholder from './DataTableNodePlaceholder'
import EditDataTableDialog from './EditDataTableDialog'
import EditDataTableMenu from './EditDataTableMenu'
import { DataTableNodeAttrs } from './hooks'

export default function DataTableNodeView({ editor, node, updateAttributes, extension }: NodeViewProps) {
  const { isEditable } = editor
  const { compileContext } = extension.options
  const { attrs } = node
  const { dataset, height, width, textAlign } = attrs as DataTableNodeAttrs
  const isNew = isEmpty(dataset.id) || isEmpty(attrs['uid'])

  const [showDialog, toggleDialog] = useToggle(false)

  const handleUpdateNodeAttrs = async (data: DataTableFormData) => {
    updateAttributes(data)
    toggleDialog(false)
  }

  const content = (
    <ResizableNodeContentContainer
      height={height}
      onResize={updateAttributes}
      resizeDirection={isEditable ? 'both' : 'none'}
      style={{ margin: textAlign === 'center' ? '0 auto' : textAlign === 'right' ? '0 0 0 auto' : 0 }}
      width={width}
    >
      {isNew ? (
        <DataTableNodePlaceholder isNodeEditable={isEditable} onClick={toggleDialog} />
      ) : (
        <DataTableNodeContent compileContext={compileContext} editor={editor} node={node} />
      )}
    </ResizableNodeContentContainer>
  )

  if (!isEditable) return <NodeViewWrapper uid={attrs.uid}>{content}</NodeViewWrapper>
  return (
    <>
      <EditableNodeViewWrapper uid={attrs.uid}>
        {content}
        <EditDataTableMenu editor={editor} onClick={toggleDialog} />
      </EditableNodeViewWrapper>

      <EditDataTableDialog
        compileContext={compileContext}
        editor={editor}
        node={node}
        onChange={handleUpdateNodeAttrs}
        onClose={toggleDialog}
        open={showDialog}
      />
    </>
  )
}
