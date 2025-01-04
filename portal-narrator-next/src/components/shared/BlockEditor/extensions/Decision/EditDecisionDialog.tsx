import { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { cloneDeep } from 'lodash'

import { Dialog, DialogBody, DialogTitle } from '@/components/primitives/Dialog'
import { IReportNodeCompileContext } from '@/stores/reports/interfaces'

import DecisionForm, { DecisionFormData } from './DecisionForm'

interface Props {
  compileContext: IReportNodeCompileContext
  node: ProseMirrorNode
  onChange: (data: DecisionFormData) => Promise<void>
  onClose: () => void
  open: boolean
}

export default function EditDecisionDialog({ compileContext, node, onChange, onClose, open }: Props) {
  const attrs = cloneDeep(node.attrs) as DecisionFormData // node.attrs is immutable, RHF needs mutable object as values

  return (
    <Dialog onClose={onClose} open={open} size="2xl">
      <DialogTitle>Edit decision</DialogTitle>
      <DialogBody>
        <DecisionForm compileContext={compileContext} onCancel={onClose} onSubmit={onChange} values={attrs} />
      </DialogBody>
    </Dialog>
  )
}
