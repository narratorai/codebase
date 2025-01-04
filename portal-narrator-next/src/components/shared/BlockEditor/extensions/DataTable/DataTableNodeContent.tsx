import { Editor } from '@tiptap/core'
import { Node as ProseMirrorNode } from '@tiptap/pm/model'

import Spin from '@/components/shared/Spin'
import Table from '@/components/shared/Table'
import { IReportNodeCompileContext } from '@/stores/reports/interfaces'

import { DataTableNodeAttrs, useCompileQuery } from './hooks'

interface Props {
  compileContext: IReportNodeCompileContext
  editor: Editor
  node: ProseMirrorNode
}

export default function DataTableNodeContent({ editor, node, compileContext }: Props) {
  const attrs = node.attrs as DataTableNodeAttrs
  const { isFetching, error, data } = useCompileQuery(editor, compileContext, attrs)

  if (isFetching)
    return (
      <div className="h-full justify-center p-4 flex-x-center">
        <Spin className="size-6 text-gray-400" />
      </div>
    )

  if (error)
    return (
      <div className="h-full justify-center rounded-lg p-4 text-sm text-red-600 bordered-gray-200 flex-y">
        {error.message}
      </div>
    )

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore Improve typing of data
  return <Table className="h-full" table={data?.content} />
}
