import camelcaseKeys from 'camelcase-keys'
import { isEmpty, last } from 'lodash'

import { DatacenterRegion, deleteMavis, getMavis, postMavis, SearchParams } from '@/util/mavisClient'

import {
  IRemoteChat,
  IRemoteChatMessage,
  IRemoteChatMessageData,
  IRemoteChatMessages,
  IRemoteChatRequestData,
  IRemoteChatRequestResponse,
  IRemoteChats,
  IRemoteChatsParams,
  IRemoteChatSuggestions,
  IRemoteCreateChatData,
  IRemoteVoteData,
} from './interfaces'

export const getChats = async (
  params?: IRemoteChatsParams,
  datacenterRegion?: DatacenterRegion
): Promise<IRemoteChats> => {
  const castParams = params as SearchParams
  return getMavis<IRemoteChats>('/api/chats', { params: castParams, datacenterRegion })
}

export const getMessages = async (
  chatId: string,
  datacenterRegion?: DatacenterRegion
): Promise<IRemoteChatMessages> => {
  return getMavis<IRemoteChatMessages>(`/api/chats/${chatId}`, { datacenterRegion })
}

export const createChat = async (
  data: IRemoteCreateChatData,
  datacenterRegion?: DatacenterRegion
): Promise<IRemoteChat> => {
  return postMavis<IRemoteChat, IRemoteCreateChatData>('/api/chats', {
    data,
    datacenterRegion,
  })
}

export const postRequest = async (
  chatId: string,
  data: IRemoteChatRequestData,
  datacenterRegion?: DatacenterRegion
): Promise<IRemoteChatRequestResponse> => {
  return postMavis<IRemoteChatRequestResponse, IRemoteChatRequestData>(`/api/chats/${chatId}/request`, {
    data,
    datacenterRegion,
  })
}

export const favoriteChat = async (chatId: string, datacenterRegion?: DatacenterRegion): Promise<null> => {
  return postMavis<null, null>(`/api/chats/${chatId}/favorite`, { data: null, datacenterRegion })
}

export const unfavoriteChat = async (chatId: string, datacenterRegion?: DatacenterRegion): Promise<null> => {
  return deleteMavis<null>(`/api/chats/${chatId}/favorite`, { datacenterRegion })
}

export const getSuggestions = async (datacenterRegion?: DatacenterRegion): Promise<IRemoteChatSuggestions> => {
  return getMavis<IRemoteChatSuggestions>('/api/chats/suggestions', { datacenterRegion })
}

export const postMessage = async (
  chatId: string,
  data: IRemoteChatMessageData,
  datacenterRegion?: DatacenterRegion,
  onChunkReceived?: (chunk: IRemoteChatMessage, progress: number) => void
): Promise<IRemoteChatMessage> => {
  const parseChunk = (chunkString: string, progress: number) => {
    if (!isEmpty(chunkString)) {
      const chunk = camelcaseKeys(JSON.parse(chunkString), { deep: true })
      const message = last(chunk['newMessages']) as IRemoteChatMessage
      onChunkReceived?.(message, progress)
    }
  }

  return postMavis<IRemoteChatMessage, IRemoteChatMessageData>(`/api/chats/${chatId}/next`, {
    data,
    params: { stream: true },
    datacenterRegion,
    onChunkReceived: onChunkReceived ? parseChunk : undefined,
  })
}

export const rateMessage = async (
  chatId: string,
  messageId: string,
  data: IRemoteVoteData,
  datacenterRegion?: DatacenterRegion
): Promise<null> => {
  return postMavis<null, IRemoteVoteData>(`/api/chats/${chatId}/vote/${messageId}`, { data, datacenterRegion })
}

export const analyzeMessage = async (
  chatId: string,
  messageId: string,
  datacenterRegion?: DatacenterRegion
): Promise<IRemoteChatMessage> => {
  return postMavis<IRemoteChatMessage, null>(`/api/chats/${chatId}/analyze/${messageId}`, {
    data: null,
    datacenterRegion,
  })
}
