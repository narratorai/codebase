import { useChat } from 'portal/stores/chats'
import { useEffect } from 'react'

import ChatMainSection from './ChatMainSection'

const NewChatSection = () => {
  const [reset] = useChat((state) => [state.reset])

  useEffect(() => {
    reset()

    return () => {
      reset()
    }
  }, [])

  return <ChatMainSection />
}

export default NewChatSection
