import { NodeViewProps, NodeViewWrapper } from '@tiptap/react'
import { isEmpty } from 'lodash'
import { useToggle } from 'react-use'

import EditableNodeViewWrapper from '../../shared/EditableNodeViewWrapper'
import EditFilterMenu from './EditFilterMenu'
import EditFilterNode from './EditFilterNode'
import { FilterFormData } from './FilterForm'
import FilterNodeContent from './FilterNodeContent'
import FilterNodePlaceholder from './FilterNodePlaceholder'
import { FilterNodeAttrs } from './hooks'

export default function FilterNodeView({ editor, node, extension, updateAttributes }: NodeViewProps) {
  const { compileContext } = extension.options
  const { attrs } = node
  const { applyOn } = attrs as FilterNodeAttrs

  const [showEditForm, toggleEditForm] = useToggle(false)

  const handleUpdateNodeAttrs = async (data: FilterFormData) => {
    updateAttributes(data)
    toggleEditForm(false)
  }

  const content = showEditForm ? (
    <EditFilterNode
      compileContext={compileContext}
      node={node}
      onCancel={toggleEditForm}
      onSubmit={handleUpdateNodeAttrs}
    />
  ) : isEmpty(applyOn) ? (
    <FilterNodePlaceholder isNodeEditable={editor.isEditable} onClick={toggleEditForm} />
  ) : (
    <FilterNodeContent compileContext={compileContext} node={node} />
  )

  if (!editor.isEditable) return <NodeViewWrapper uid={attrs.uid}>{content}</NodeViewWrapper>
  return (
    <EditableNodeViewWrapper uid={attrs.uid}>
      {content}
      <EditFilterMenu onClick={toggleEditForm} />
    </EditableNodeViewWrapper>
  )
}
