import { NodeViewContent, NodeViewProps, NodeViewWrapper } from '@tiptap/react'

import EmojiPicker from '../../EmojiPicker'
import EditableNodeViewWrapper from '../../shared/EditableNodeViewWrapper'
import EditCalloutMenu from './EditCalloutMenu'

/**
 * Node view that renders a callout box.
 */
export default function CalloutNodeView({ node, editor, updateAttributes }: NodeViewProps) {
  const { isEditable } = editor
  const { attrs } = node
  const { backgroundColor, icon, hideIcon } = attrs

  const handleIconChange = (icon: string) => {
    updateAttributes({ icon })
  }

  const content = (
    <div className="gap-1 p-1.5 flex-x-start">
      {hideIcon ? null : (
        <div className="shrink-0 p-1 text-xl">
          {isEditable ? <EmojiPicker onChange={handleIconChange} value={icon} /> : icon}
        </div>
      )}
      <div className="flex-1 p-1.5">
        <NodeViewContent />
      </div>
    </div>
  )

  if (!isEditable)
    return (
      <NodeViewWrapper className="rounded-md" style={{ backgroundColor }} uid={attrs.uid}>
        {content}
      </NodeViewWrapper>
    )

  return (
    <EditableNodeViewWrapper className="rounded-md" style={{ backgroundColor }} uid={attrs.uid}>
      {content}
      <EditCalloutMenu node={node} updateAttributes={updateAttributes} />
    </EditableNodeViewWrapper>
  )
}
