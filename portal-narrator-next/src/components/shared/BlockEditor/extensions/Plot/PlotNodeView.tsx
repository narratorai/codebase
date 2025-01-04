import { NodeViewProps, NodeViewWrapper } from '@tiptap/react'
import { isEmpty } from 'lodash'
import { useToggle } from 'react-use'

import EditableNodeViewWrapper from '../../shared/EditableNodeViewWrapper'
import ResizableNodeContentContainer from '../../shared/ResizableNodeContentContainer'
import EditPlotDialog from './EditPlotDialog'
import EditPlotMenu from './EditPlotMenu'
import { PlotNodeAttrs } from './hooks'
import { PlotFormData } from './PlotForm'
import PlotNodeContent from './PlotNodeContent'
import PlotNodePlaceholder from './PlotNodePlaceholder'

export default function PlotNodeView({ editor, node, updateAttributes, extension }: NodeViewProps) {
  const { isEditable } = editor
  const { compileContext } = extension.options
  const { attrs } = node
  const { dataset, height, width, textAlign } = attrs as PlotNodeAttrs
  const isNew = isEmpty(dataset.id) || isEmpty(attrs['uid'])

  const [showEditDialog, toggleEditDialog] = useToggle(false)

  const handleUpdateNodeAttrs = async (data: PlotFormData) => {
    updateAttributes(data)
    toggleEditDialog(false)
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
        <PlotNodePlaceholder isNodeEditable={isEditable} onClick={toggleEditDialog} />
      ) : (
        <PlotNodeContent compileContext={compileContext} editor={editor} node={node} />
      )}
    </ResizableNodeContentContainer>
  )

  if (!isEditable) return <NodeViewWrapper uid={attrs.uid}>{content}</NodeViewWrapper>
  return (
    <>
      <EditableNodeViewWrapper uid={attrs.uid}>
        {content}
        <EditPlotMenu editor={editor} onEditClick={toggleEditDialog} />
      </EditableNodeViewWrapper>

      <EditPlotDialog
        compileContext={compileContext}
        editor={editor}
        node={node}
        onChange={handleUpdateNodeAttrs}
        onClose={toggleEditDialog}
        open={showEditDialog}
      />
    </>
  )
}
