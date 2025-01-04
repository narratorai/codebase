import { Editor } from '@tiptap/core'
import { Node as ProseMirrorNode } from '@tiptap/pm/model'

import PlotChart from '@/components/shared/PlotChart'
import Spin from '@/components/shared/Spin'
import { IReportNodeCompileContext } from '@/stores/reports/interfaces'

import { DatasetMetricNodeAttrs, useCompileQuery } from './hooks'

interface Props {
  compileContext: IReportNodeCompileContext
  editor: Editor
  node: ProseMirrorNode
}

export default function DatasetMetricNodeContent({ editor, node, compileContext }: Props) {
  const attrs = node.attrs as DatasetMetricNodeAttrs
  const { isFetching, error, data } = useCompileQuery(editor, compileContext, attrs)

  if (isFetching || !data)
    return (
      <div className="h-full justify-center p-4 flex-x-center">
        <Spin className="size-6 text-gray-400" />
      </div>
    )

  if (error) return <div className="h-full justify-center p-4 text-sm text-red-600 flex-x-center">{error.message}</div>

  const { content } = data
  return (
    <div className="relative">
      <div className="z-10 mx-auto flex flex-col gap-y-4 px-4 py-8">
        <dt className="text-base/7 text-gray-600">{content.title}</dt>
        <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
          {content.currentValue}
        </dd>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-0">
        {attrs.showPlot && content.plotData ? <PlotChart {...content.plotData} height={100} /> : null}
      </div>
    </div>
  )
}
