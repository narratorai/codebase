import { useRouter, useSearchParams } from 'next/navigation'

import { useCompanySlugParam } from '@/hooks'

const useNavigate = () => {
  const companySlug = useCompanySlugParam()
  const searchParams = useSearchParams()
  const router = useRouter()

  const navigateToChat = (chatId: string) => {
    const href = `/v2/${companySlug}/chats/${chatId}?${searchParams?.toString()}`
    router.push(href)
  }

  return navigateToChat
}

export default useNavigate
