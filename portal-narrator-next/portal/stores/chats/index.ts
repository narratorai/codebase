import { IChat, IRemoteChats, IRemoteMessage, MessageTypes } from './interfaces'
import { useChat } from './useChat'
import { useChats } from './useChats'
import { useChatSuggestions } from './useChatSuggestions'

export { MessageTypes, useChat, useChats, useChatSuggestions }
export type { IChat as IChatStore, IRemoteMessage as IMessage, IRemoteChats }
