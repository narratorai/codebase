import { produce } from 'immer'
import { create } from 'zustand'

import ChatsRepository from './ChatsRepository'
import { IChats } from './interfaces'

// Typed created to hide the repository from the store public interface
type IChatsStore = IChats & { _repository: ChatsRepository }

/**
 * A store for managing a collection of chats.
 */
export const useChats = create<IChatsStore>((set, get) => ({
  total: 0,
  chats: [],

  _repository: new ChatsRepository(),

  async fetch(params, datacenterRegion) {
    const { _repository } = get()
    const response = await _repository.findAll(params, datacenterRegion)
    const chats = response.data

    set({ chats, total: chats.length })
    return chats
  },

  async create(data, datacenterRegion) {
    const { _repository } = get()
    const response = await _repository.create(data, datacenterRegion)
    const chat = response.data

    set(
      produce((state: IChats) => {
        state.chats.unshift(chat)
        state.total += 1
      })
    )

    return chat
  },

  set,

  unshift(chat) {
    set(
      produce((state: IChats) => {
        state.chats.unshift(chat)
        state.total += 1
      })
    )
  },

  remove(chatId) {
    set(
      produce((state: IChats) => {
        const chatIndex = state.chats.findIndex((chat) => chat.id === chatId)
        if (chatIndex !== -1) {
          state.chats.splice(chatIndex, 1)
          state.total -= 1
        }
      })
    )
  },
}))
