import { produce } from 'immer'
import { create } from 'zustand'

import * as api from './chatsApi'
import { IChatSuggestions } from './interfaces'

/**
 * A store for managing a suggestions in chats.
 */
const useChatSuggestions = create<IChatSuggestions>((set) => ({
  totalCount: 0,
  data: [],
  selectedSuggestion: '',

  set,

  reset() {
    set({
      totalCount: 0,
      data: [],
      selectedSuggestion: '',
    })
  },

  setSelectedSuggestion(suggestion: string) {
    set({ selectedSuggestion: suggestion })
  },

  async getSuggestions(datacenterRegion) {
    const response = await api.getSuggestions(datacenterRegion)

    set(
      produce((state: IChatSuggestions) => {
        state.totalCount = response.totalCount
        state.data = response.data
      })
    )

    return response
  },
}))

export default useChatSuggestions
