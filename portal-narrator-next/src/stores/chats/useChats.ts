import { produce } from 'immer'
import { find, uniqBy } from 'lodash'
import { create } from 'zustand'

import * as api from './chatsApi'
import { IChats } from './interfaces'

/**
 * A store for managing chats.
 */
const useChats = create<IChats>((set, get) => ({
  totalCount: 0,
  page: 0,
  perPage: 50,
  data: [],
  params: null,

  set,

  reset() {
    set({
      totalCount: 0,
      page: 0,
      perPage: 50,
      data: [],
      params: null,
    })
  },

  async searchChats(params, datacenterRegion) {
    const { perPage, params: storeParams } = get()

    const savedParams = storeParams || {}

    const inputParams = params || {}

    const newParams = { ...savedParams, ...inputParams, perPage, page: 1 }

    const response = await api.getChats(newParams, datacenterRegion)

    set({ ...response, params: newParams })

    return response
  },

  async getNextPage(datacenterRegion) {
    const { page, perPage, totalCount, data, params: storeParams } = get()
    if (page > 0 && page * perPage >= totalCount) return null
    const savedParams = storeParams || {}
    const params = { ...savedParams, page: page + 1, perPage }
    const response = await api.getChats(params, datacenterRegion)

    const newData = uniqBy([...data, ...response.data], 'id')

    set(
      produce((state: IChats) => {
        state.totalCount = response.totalCount
        state.page = response.page
        state.perPage = response.perPage
        state.data = newData
      })
    )

    return response
  },

  async createChat(data, datacenterRegion) {
    const chat = await api.createChat(data, datacenterRegion)

    set(
      produce((state: IChats) => {
        state.data.unshift(chat)
        state.totalCount += 1
      })
    )

    return chat
  },

  unshiftChat(chat) {
    set(
      produce((state: IChats) => {
        state.data.unshift(chat)
        state.totalCount += 1
      })
    )
  },

  removeChat(chatId) {
    set(
      produce((state: IChats) => {
        const chatIndex = state.data.findIndex((chat) => chat.id === chatId)
        if (chatIndex !== -1) {
          state.data.splice(chatIndex, 1)
          state.totalCount -= 1
        }
      })
    )
  },

  getChat(chatId) {
    const { data } = get()
    const chat = find(data, { id: chatId })
    if (chat === undefined) return null
    return chat
  },
}))

export default useChats
