import { NodeViewProps, NodeViewWrapper } from '@tiptap/react'
import { isEmpty } from 'lodash'
import { useToggle } from 'react-use'

import EditableNodeViewWrapper from '../../shared/EditableNodeViewWrapper'
import { DatasetMetricFormData } from './DatasetMetricForm'
import DatasetMetricNodeContent from './DatasetMetricNodeContent'
import DatasetMetricNodePlaceholder from './DatasetMetricNodePlaceholder'
import EditDatasetMetricNode from './EditDatasetMetricNode'
import EditFilterMenu from './EditFilterMenu'

export default function DatasetMetricNodeView({ editor, node, extension, updateAttributes }: NodeViewProps) {
  const { compileContext } = extension.options
  const { attrs } = node
  const { dataset } = attrs
  const isNew = isEmpty(dataset?.id)

  const [showForm, toggleForm] = useToggle(false)

  const handleUpdateNodeAttrs = async (data: DatasetMetricFormData) => {
    updateAttributes(data)
    toggleForm(false)
  }

  const content = showForm ? (
    <EditDatasetMetricNode node={node} onCancel={toggleForm} onSubmit={handleUpdateNodeAttrs} />
  ) : isNew ? (
    <DatasetMetricNodePlaceholder isNodeEditable={editor.isEditable} onClick={toggleForm} />
  ) : (
    <DatasetMetricNodeContent compileContext={compileContext} editor={editor} node={node} />
  )

  if (!editor.isEditable) return <NodeViewWrapper uid={attrs.uid}>{content}</NodeViewWrapper>
  return (
    <EditableNodeViewWrapper uid={attrs.uid}>
      {content}
      {isNew ? null : <EditFilterMenu onClick={toggleForm} />}
    </EditableNodeViewWrapper>
  )
}
