import { useToggle } from 'react-use'

import type { IChatMessageRequestFormData } from '@/components/chats/ChatMessageRequestForm'
import { ChatMessageRequestForm } from '@/components/chats/ChatMessageRequestForm'
import { Dialog, DialogContent, DialogHeader } from '@/components/shared/Dialog'

import ThumbsDownButton from './ThumbsDownButton'

interface Props {
  disabled?: boolean
  loading: boolean
  marked: boolean
  onSubmit: (data: IChatMessageRequestFormData) => Promise<void>
}

const RequestDialog = ({ disabled = false, loading, marked, onSubmit }: Props) => {
  const [open, toggleOpen] = useToggle(false)

  const handleSubmit = async (data: IChatMessageRequestFormData) => {
    toggleOpen(false)
    await onSubmit(data)
  }

  return (
    <Dialog onOpenChange={toggleOpen} open={open}>
      <ThumbsDownButton disabled={disabled} loading={loading} marked={marked} onClick={toggleOpen} />
      <DialogContent className="w-full min-w-80 max-w-xl">
        <DialogHeader>
          <p>Request Human Review</p>
        </DialogHeader>
        <ChatMessageRequestForm onCancel={toggleOpen} onSubmit={handleSubmit} />
      </DialogContent>
    </Dialog>
  )
}

export default RequestDialog
