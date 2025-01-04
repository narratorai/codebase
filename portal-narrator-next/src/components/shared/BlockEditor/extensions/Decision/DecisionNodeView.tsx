import { NodeViewProps, NodeViewWrapper } from '@tiptap/react'
import { isEmpty } from 'lodash'
import { useToggle } from 'react-use'

import EditableNodeViewWrapper from '../../shared/EditableNodeViewWrapper'
import { DecisionFormData } from './DecisionForm'
import DecisionNodeContent from './DecisionNodeContent'
import DecisionNodePlaceholder from './DecisionNodePlaceholder'
import EditDecisionDialog from './EditDecisionDialog'
import EditDecisionMenu from './EditDecisionMenu'
import { DecisionNodeAttrs } from './hooks'

export default function DecisionNodeView({ editor, node, extension, updateAttributes, getPos }: NodeViewProps) {
  const { isEditable } = editor
  const { compileContext } = extension.options
  const { attrs } = node
  const { prompt, datasets } = attrs as DecisionNodeAttrs
  const isNewNode = isEmpty(prompt) || isEmpty(datasets)

  const [showEditDialog, toggleEditDialog] = useToggle(false)

  const handleUpdateNodeAttrs = async (data: DecisionFormData) => {
    updateAttributes(data)
    toggleEditDialog(false)
  }

  const content = isNewNode ? (
    <DecisionNodePlaceholder isNodeEditable={isEditable} onClick={toggleEditDialog} />
  ) : (
    <DecisionNodeContent compileContext={compileContext} editor={editor} getPos={getPos} node={node} />
  )

  if (!isEditable) return <NodeViewWrapper uid={attrs.uid}>{content}</NodeViewWrapper>
  return (
    <>
      <EditableNodeViewWrapper uid={attrs.uid}>
        {content}
        <EditDecisionMenu onClick={toggleEditDialog} />
      </EditableNodeViewWrapper>

      <EditDecisionDialog
        compileContext={compileContext}
        node={node}
        onChange={handleUpdateNodeAttrs}
        onClose={toggleEditDialog}
        open={showEditDialog}
      />
    </>
  )
}
