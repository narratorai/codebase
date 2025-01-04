import { App } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { LayoutContent } from 'components/shared/layout/LayoutWithFixedSider'
import { isEmpty } from 'lodash'
import { IMessage, useChat, useChats } from 'portal/stores/chats'
import { useState } from 'react'
import styled from 'styled-components'
import { colors } from 'util/constants'

import AutoScrollIntoView from './AutoScrollIntoView'
import Chat from './Chat'
import ChatContent from './ChatContent'
import ChatFooter from './ChatFooter'
import ChatHeader from './ChatHeader'
import LoadingBar from './List/LoadingBar'
import WelcomeToChat from './List/WelcomeToChat'
import { PromptFormData } from './PromptForm'

const StyledLayoutContent = styled(LayoutContent)`
  display: flex;
  flex-direction: column;
  background: ${colors.mavis_off_white};
  padding: 0;
  box-shadow: none;
`

const StyledChatContainer = styled.div`
  height: 100%;
  padding: 24px;
  overflow: scroll;
  flex: 1;
`

const ChatMainSection = () => {
  const { notification } = App.useApp()
  const company = useCompany()
  const chat = useChat()
  const [showLoader, setIsLoading] = useState(false) // TODO: use a react-query mutation
  const [createChat] = useChats((state) => [state.create])

  const isNewChat = isEmpty(chat.id)

  const handlePromptSubmit = async (data: PromptFormData) => {
    const message = {
      type: 'Text',
      role: 'user',
      data: { content: data.prompt },
      suggestions: [],
      created_at: new Date().toISOString(),
      updated_at: null,
      rerun: false,
      request_id: null,
      rating: 0,
      id: '',
      agent: null,
    }
    chat.addMessage(message as IMessage)
    setIsLoading(true)

    try {
      if (isNewChat) {
        await handleCreateChat({ table_id: data.activityStreamId, messages: [message] })
      } else {
        await handleCreateReply({ messages: [message] })
      }
    } catch (error) {
      const errorMessage = {
        type: 'Error',
        role: 'mavis',
        data: {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore This is actually an AxiosError wrapping MavisError
          content: error.response?.data?.message,
        },
        created_at: Date.now().toLocaleString(),
      }

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (error.response) chat.addMessage(errorMessage as IRemoteMessage)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      else notification.error({ message: error.message || error })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateChat = async (data: Record<string, unknown>) => {
    const chat = await createChat(data, company.datacenter_region)

    // TODO: shallow push is not available in the current version of react-router
    const params = window.location.search
    window.history.pushState({ chatId: chat.id }, '', `/${company.slug}/chat/${chat.id}${params}`)
    useChat.setState(chat)
  }

  const handleCreateReply = async (data: Record<string, unknown>) => {
    await chat.postMessage(data)
  }

  return (
    <StyledLayoutContent siderWidth={0}>
      <ChatHeader activityStreamId={chat.table_id} showActivityStream={!isNewChat} />
      <StyledChatContainer>
        {chat.id ? <Chat /> : isEmpty(chat.messages) ? <WelcomeToChat /> : <ChatContent chat={chat} />}
        {showLoader && (
          <AutoScrollIntoView>
            <LoadingBar />
          </AutoScrollIntoView>
        )}
      </StyledChatContainer>
      <ChatFooter onPromptSubmit={handlePromptSubmit} />
    </StyledLayoutContent>
  )
}

export default ChatMainSection
