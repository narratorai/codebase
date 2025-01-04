'use client'

import { useRouter } from 'next/navigation'

import PageContent from '@/components/shared/PageContent'
import { useCompany } from '@/stores/companies'

import NewChat from './NewChat'

const ChatsPageContent = () => {
  const companySlug = useCompany((state) => state.slug)
  const router = useRouter()

  const openChatPage = (chatId: string) => {
    router.push(`/v2/${companySlug}/chats/${chatId}`)
  }

  return (
    <PageContent>
      <NewChat onCreate={openChatPage} />
    </PageContent>
  )
}

export default ChatsPageContent
