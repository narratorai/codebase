/* eslint-disable max-lines-per-function */
import { produce } from 'immer'
import { create } from 'zustand'

import * as api from './chatsApi'
import { IChat, IRemoteChatMessage } from './interfaces'

const initialState = {
  id: '',
  createdAt: '',
  createdBy: null,
  favorited: false,
  totalFavorites: 0,
  teamIds: [],
  tagIds: [],
  sharedWithEveryone: false,
  tableId: '',
  summary: '',
  detailedSummary: null,
  messages: [],
}

/**
 * A store for managing a chat.
 */
const useChat = create<IChat>((set, get) => ({
  ...initialState,
  set,

  reset() {
    set(initialState)
  },

  async initiateChat(datacenterRegion) {
    const { id, upsertMessage } = get()
    if (id === '') return

    const payload = { content: '' }
    await api.postMessage(id, payload, datacenterRegion, upsertMessage)
  },

  async favoriteChat(datacenterRegion) {
    const { id } = get()

    if (id === '') return

    set(
      produce((state: IChat) => {
        state.favorited = true
      })
    )

    await api.favoriteChat(id, datacenterRegion)
  },

  async unfavoriteChat(datacenterRegion) {
    const { id } = get()

    if (id === '') return

    set(
      produce((state: IChat) => {
        state.favorited = false
      })
    )

    await api.unfavoriteChat(id, datacenterRegion)
  },

  async getMessages(datacenterRegion) {
    const { id } = get()
    if (id === '') return null
    const data = await api.getMessages(id, datacenterRegion)
    set(
      produce((state: IChat) => {
        state.messages = data.messages
      })
    )

    return data
  },

  addMessage: (message) => {
    set(
      produce((state: IChat) => {
        state.messages.push(message)
      })
    )
  },

  setMessages: (messages) => {
    set(
      produce((state: IChat) => {
        state.messages = messages
      })
    )
  },

  setMessage: (messageId, message) => {
    const { messages } = get()
    set(
      produce((state: IChat) => {
        const index = messages.findIndex((message) => message.id === messageId)
        state.messages[index] = message
      })
    )
  },

  upsertMessage: (message) => {
    const { messages } = get()

    const index = messages.findIndex((m) => m.id === message.id)
    if (index === -1) {
      set(
        produce((state: IChat) => {
          state.messages.push(message)
        })
      )
    } else {
      set(
        produce((state: IChat) => {
          state.messages[index] = message
        })
      )
    }
  },

  async postMessage(prompt, datacenterRegion) {
    const { id, addMessage, upsertMessage } = get()
    if (id === '') return

    const userMessage = {
      id: '',
      type: 'user_message',
      role: 'user',
      data: { text: prompt },
      isComplete: true,
      loading: {
        percent: 100,
        message: '',
      },
      suggestions: [],
      requestId: null,
      rating: 0,
      createdAt: new Date().toISOString(),
      updatedAt: null,
      toolRequest: null,
      content: null,
      toolCallId: null,
      functionName: null,
      hidden: false,
    }
    addMessage(userMessage as IRemoteChatMessage)

    const payload = { content: prompt }
    await api.postMessage(id, payload, datacenterRegion, upsertMessage)
  },

  async requestTraining(data, datacenterRegion) {
    const { id, messages } = get()
    // TODO: We are not handling possible response errors here or anywhere else in the store.
    // We should think about that.
    const response = await api.postRequest(id, data, datacenterRegion)
    const { messageId } = data
    const index = messages.findIndex((message) => message.id === messageId)

    set(
      produce((state: IChat) => {
        state.messages[index].requestId = response.requestId
      })
    )

    return response
  },

  async rateMessage(messageId, rating, datacenterRegion) {
    const { id, messages } = get()
    const data = { rating }
    await api.rateMessage(id, messageId, data, datacenterRegion)

    set(
      produce((state: IChat) => {
        const index = messages.findIndex((message) => message.id === messageId)
        state.messages[index].rating = rating
      })
    )
  },

  async analyzeMessage(messageId, datacenterRegion) {
    const { id, messages } = get()
    const response = await api.analyzeMessage(id, messageId, datacenterRegion)
    const { data: messageData } = response

    set(
      produce((state: IChat) => {
        const index = messages.findIndex((message) => message.id === messageId)
        state.messages[index].data = messageData
      })
    )

    return response
  },
}))

export default useChat
