import { AppRouterPageRouteOpts } from '@auth0/nextjs-auth0'

import { ChatPageContent, ChatPageHeader } from '@/components/chats/Chat'
import Page from '@/components/shared/Page'
import { auth0 } from '@/util/server/auth0'

async function ChatPage({ params }: AppRouterPageRouteOpts) {
  const { chatId } = params as { chatId: string }

  return (
    <Page hideChatWidget>
      <ChatPageHeader />
      <ChatPageContent chatId={chatId} />
    </Page>
  )
}

export default auth0.withPageAuthRequired(ChatPage)
