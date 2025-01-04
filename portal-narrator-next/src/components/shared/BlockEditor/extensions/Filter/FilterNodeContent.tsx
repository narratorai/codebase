import { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { isEmpty } from 'lodash'

import { Card, CardBody, CardHeader } from '@/components/primitives/Card'
import { useSearchParams } from '@/hooks'
import { useReportFilters } from '@/stores/reports'
import { IReportNodeCompileContext } from '@/stores/reports/interfaces'

import ApplyFilterForm, { ApplyFilterFormData } from './ApplyFilterForm'
import { FilterNodeAttrs, useCompileQuery } from './hooks'

interface Props {
  compileContext: IReportNodeCompileContext
  node: ProseMirrorNode
}

export default function FilterNodeContent({ compileContext, node }: Props) {
  const attrs = node.attrs as FilterNodeAttrs
  const { uid, name, applyOn, defaultValue } = attrs
  const { isError, error, data } = useCompileQuery(compileContext, attrs)
  const { constraintList } = data?.content || {}

  const [searchParams] = useSearchParams()
  const addFilterToStage = useReportFilters((state) => state.addToStage)

  const handleSubmit = async (data: ApplyFilterFormData) => {
    const searchParamValue = isEmpty(data.value) ? null : data
    addFilterToStage(uid, searchParamValue)
  }

  return (
    <Card divided>
      <CardHeader>
        <h3>{name}</h3>
      </CardHeader>
      <CardBody>
        {isError ? (
          <div className="rounded bg-red-100 p-2 text-sm text-red-600">
            <p>{error.message}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              {applyOn.map((column) => (
                <div className="truncate rounded bg-gray-100 p-2 text-sm" key={column.id}>
                  {column.label}
                </div>
              ))}
            </div>
            <ApplyFilterForm
              defaultValues={{ value: defaultValue }}
              filter={{ constraintList, ...attrs }}
              onSubmit={handleSubmit}
              values={searchParams[uid] as ApplyFilterFormData}
            />
          </div>
        )}
      </CardBody>
    </Card>
  )
}
