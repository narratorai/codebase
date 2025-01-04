import { Editor } from '@tiptap/core'
import { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { cloneDeep, get, isEmpty } from 'lodash'
import { useState } from 'react'
import EditIcon from 'static/mavis/icons/edit.svg'

import { Dialog, DialogBody, DialogTitle } from '@/components/primitives/Dialog'
import EmptyState from '@/components/primitives/EmptyState'
import { IReportNodeCompileContext } from '@/stores/reports/interfaces'

import PlotForm, { PlotFormData } from './PlotForm'
import PlotNodeContent from './PlotNodeContent'

interface Props {
  compileContext: IReportNodeCompileContext
  editor: Editor
  node: ProseMirrorNode
  onChange: (data: PlotFormData) => Promise<void>
  onClose: () => void
  open: boolean
}

export default function EditPlotDialog({ editor, node, compileContext, onChange, onClose, open }: Props) {
  const { schema } = editor
  const attrs = cloneDeep(node.attrs) as PlotFormData // node.attrs is immutable, RHF needs mutable object as values
  const [previewAttrs, setPreviewAttrs] = useState(attrs)

  return (
    <Dialog onClose={onClose} open={open} size="5xl">
      <DialogTitle>
        <div className="gap-3 flex-x-center">
          <EditIcon className="size-6" />
          <p className="font-medium">Edit plot</p>
        </div>
      </DialogTitle>
      <DialogBody>
        <div className="grid grid-cols-6 gap-6">
          <div className="col-span-2">
            <PlotForm onCancel={onClose} onChange={setPreviewAttrs} onSubmit={onChange} values={attrs} />
          </div>
          <div className="col-span-4 min-h-[500px]">
            {isEmpty(get(previewAttrs, 'dataset.tab.plot.slug')) ? (
              <EmptyState description="This plot has no data to display." title="No data" />
            ) : (
              <PlotNodeContent
                compileContext={compileContext}
                editor={editor}
                node={schema.nodes.plot.create(cloneDeep(previewAttrs))}
              />
            )}
          </div>
        </div>
      </DialogBody>
    </Dialog>
  )
}
