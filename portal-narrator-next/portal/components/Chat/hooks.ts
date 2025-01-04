import { useQuery } from '@tanstack/react-query'
import { useCompany } from 'components/context/company/hooks'
import { last } from 'lodash'
import { IChatStore } from 'portal/stores/chats'
import { useEffect, useState } from 'react'
import { loadPersistedActivityStream } from 'util/persistActivityStream'

export function useLastActivityStream() {
  const company = useCompany()
  const defaultActivityStream = loadPersistedActivityStream(company)

  return useState(defaultActivityStream?.id || company?.tables?.[0]?.id)
}

export function useChatRerun(chat: IChatStore) {
  const company = useCompany()
  const { messages } = chat
  const lastMessage = last(messages)

  const { isFetching, refetch } = useQuery({
    queryKey: ['chat-rerun', chat.id, lastMessage?.id],
    queryFn: () => chat.rerun(company.datacenter_region),
    enabled: false,
  })

  useEffect(() => {
    if (lastMessage?.rerun) {
      refetch()
    }
  }, [lastMessage, refetch])

  return { isFetching, reason: { message: lastMessage } }
}
