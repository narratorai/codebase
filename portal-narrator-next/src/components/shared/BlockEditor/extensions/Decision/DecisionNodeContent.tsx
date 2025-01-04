import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { Editor } from '@tiptap/core'
import { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { useEffect, useState } from 'react'

import { Card, CardBody } from '@/components/primitives/Card'
import EmptyState from '@/components/primitives/EmptyState'
import { IReportNodeCompileContext } from '@/stores/reports/interfaces'

import { DecisionNodeAttrs, useCompileQuery } from './hooks'

interface Props {
  compileContext: IReportNodeCompileContext
  editor: Editor
  getPos: () => number
  node: ProseMirrorNode
}

export default function DecisionNodeContent({ editor, compileContext, getPos, node }: Props) {
  const attrs = node.attrs as DecisionNodeAttrs
  const { isError, isLoading, error, data } = useCompileQuery(editor, compileContext, attrs)
  const [rendered, setRendered] = useState(false)

  useEffect(() => {
    if (!data || isError || isLoading || rendered) return

    const tr = editor.state.tr
    const positionAfter = node.nodeSize + 1
    const contentNode = editor.schema.nodeFromJSON(data.content.content)
    tr.insert(getPos() + positionAfter, contentNode)

    editor.view.dispatch(tr)
    setRendered(true)
  }, [data, isError, isLoading])

  if (isError || isLoading)
    return (
      <Card well>
        <CardBody>
          {isError && <p className="text-red-600">{error.message}</p>}
          {isLoading && <ArrowPathIcon className="h-5 animate-spin" />}
        </CardBody>
      </Card>
    )

  if (!data) return <EmptyState description="No data available" title={attrs.title} />
  return <pre>{JSON.stringify(data.content.content, null, 2)}</pre>
}
