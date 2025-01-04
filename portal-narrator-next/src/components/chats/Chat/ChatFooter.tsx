import ChatPromptForm from '@/components/chats/ChatPrompt'

interface Props {
  onSubmit: (data: { prompt: string }) => Promise<void>
  prompt: string
}

const ChatFooter = ({ onSubmit, prompt }: Props) => {
  return (
    <footer className="px-10 py-6">
      <ChatPromptForm defaultValues={{ prompt }} onSubmit={onSubmit} />
    </footer>
  )
}

export default ChatFooter
