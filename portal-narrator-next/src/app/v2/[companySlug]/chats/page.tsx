import { ChatPageHeader, ChatsPageContent } from '@/components/chats/Chat'
import Page from '@/components/shared/Page'
import { auth0 } from '@/util/server/auth0'

async function ChatsIndexPage() {
  return (
    <Page hideChatWidget>
      <ChatPageHeader isNew />
      <ChatsPageContent />
    </Page>
  )
}

export default auth0.withPageAuthRequired(ChatsIndexPage)
