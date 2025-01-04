import { Editor } from '@tiptap/core'
import { Node as ProseMirrorNode } from '@tiptap/pm/model'

import PlotChart from '@/components/shared/PlotChart'
import Spin from '@/components/shared/Spin'
import { IReportNodeCompileContext } from '@/stores/reports/interfaces'

import { PlotNodeAttrs, useCompileQuery } from './hooks'

interface Props {
  compileContext: IReportNodeCompileContext
  editor: Editor
  node: ProseMirrorNode
}

export default function PlotNodeContent({ editor, compileContext, node }: Props) {
  const attrs = node.attrs as PlotNodeAttrs
  const { height } = attrs
  const { isFetching, error, data } = useCompileQuery(editor, compileContext, attrs)

  if (isFetching)
    return (
      <div className="h-full justify-center p-4 flex-x-center">
        <Spin className="size-6 text-gray-400" />
      </div>
    )

  if (error) return <div className="h-full justify-center p-4 text-sm text-red-600 flex-x-center">{error.message}</div>

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore Improve typing of data
  return <PlotChart {...data?.content} height={height} />
}
