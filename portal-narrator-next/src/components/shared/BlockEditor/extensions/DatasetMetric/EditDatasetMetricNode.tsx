import { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { cloneDeep } from 'lodash'
import EditIcon from 'static/mavis/icons/edit.svg'

import { Card, CardBody, CardHeader } from '@/components/primitives/Card'

import DatasetMetricForm, { DatasetMetricFormData } from './DatasetMetricForm'

interface Props {
  node: ProseMirrorNode
  onCancel: () => void
  onSubmit: (data: DatasetMetricFormData) => Promise<void>
}

export default function EditDatasetMetricNode({ node, onSubmit, onCancel }: Props) {
  const attrs = cloneDeep(node.attrs) as DatasetMetricFormData

  return (
    <Card divided>
      <CardHeader>
        <div className="gap-3 flex-x-center">
          <EditIcon className="size-6" />
          <h3>Edit metric</h3>
        </div>
      </CardHeader>
      <CardBody>
        <div className="text-left">
          <DatasetMetricForm onCancel={onCancel} onSubmit={onSubmit} values={attrs} />
        </div>
      </CardBody>
    </Card>
  )
}
