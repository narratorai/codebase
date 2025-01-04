import { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { cloneDeep } from 'lodash'
import AddFilterIcon from 'static/mavis/icons/filter-add.svg'

import { Card, CardBody, CardHeader } from '@/components/primitives/Card'
import { IReportNodeCompileContext } from '@/stores/reports/interfaces'

import FilterForm, { FilterFormData } from './FilterForm'

interface Props {
  compileContext: IReportNodeCompileContext
  node: ProseMirrorNode
  onCancel: () => void
  onSubmit: (data: FilterFormData) => Promise<void>
}

export default function EditFilterNode({ node, compileContext, onSubmit, onCancel }: Props) {
  const { attrs } = node
  const values = cloneDeep(attrs) as FilterFormData // Cloning attrs to avoid mutation of the original object on cancel

  return (
    <Card divided>
      <CardHeader>
        <div className="gap-3 flex-x-center">
          <AddFilterIcon className="h-6 w-6 text-gray-800" />
          <h3>Filter</h3>
        </div>
      </CardHeader>
      <CardBody>
        <div className="text-left">
          <FilterForm compileContext={compileContext} onCancel={onCancel} onSubmit={onSubmit} values={values} />
        </div>
      </CardBody>
    </Card>
  )
}
