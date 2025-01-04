/* eslint-disable max-lines-per-function */
import { produce } from 'immer'
import { create } from 'zustand'

import ChatsRepository from './ChatsRepository'
import { IChat } from './interfaces'

// Typed created to hide the repository from the store public interface
type IChatStore = IChat & { _repository: ChatsRepository }

/**
 * A store for managing a chat.
 */
export const useChat = create<IChatStore>((set, get) => ({
  id: '',
  table_id: '',
  question: '',
  rating: 0,
  messages: [],
  created_at: '',
  created_by: '',

  _repository: new ChatsRepository(),

  set,

  reset() {
    set({
      id: '',
      table_id: '',
      question: '',
      messages: [],
      created_at: '',
      created_by: '',
    })
  },

  async fetch(datacenterRegion) {
    const { _repository, id } = get()
    const response = await _repository.find(id, datacenterRegion)

    set(response.data)
    return true
  },

  async rerun(datacenterRegion) {
    const { _repository, id } = get()
    const response = await _repository.rerun(id, datacenterRegion)
    const message = response.data

    set(
      produce((state: IChat) => {
        state.messages.push(message)
      })
    )

    return message
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

  async postMessage(data, datacenterRegion) {
    const { _repository, id } = get()
    const response = await _repository.postMessage(id, data, datacenterRegion)
    const message = response.data

    set(
      produce((state: IChat) => {
        state.messages.push(message)
      })
    )

    return message
  },

  async sendTrainingRequest(data) {
    const { _repository, id, messages } = get()
    // TODO: We are not handling possible response errors here or anywhere else in the store.
    // We should think about that.
    const response = await _repository.sendTrainingRequest(id, data)
    const { message_id } = data
    const { request_id } = response.data
    const index = messages.findIndex((message) => message.id === message_id)
    set(
      produce((state: IChat) => {
        state.messages[index].request_id = request_id
      })
    )
  },

  async postMessageRating(messageId, rating, datacenterRegion) {
    const { _repository, id, messages } = get()
    await _repository.postMessageRating(id, messageId, rating, datacenterRegion)

    set(
      produce((state: IChat) => {
        const index = messages.findIndex((message) => message.id === messageId)
        state.messages[index].rating = rating
      })
    )
  },
  async analyzePlot(messageId, datacenterRegion) {
    const { _repository, id, messages } = get()
    const response = await _repository.analyzePlot(id, messageId, datacenterRegion)

    const { data } = response
    const { data: messageData } = data

    set(
      produce((state: IChat) => {
        const index = messages.findIndex((message) => message.id === messageId)
        state.messages[index].data = messageData
      })
    )
  },
}))
