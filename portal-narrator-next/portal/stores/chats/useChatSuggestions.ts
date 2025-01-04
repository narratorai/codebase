import { produce } from 'immer'
import { create } from 'zustand'

import ChatsRepository from './ChatsRepository'
import { IChatsSuggestions } from './interfaces'

// Typed created to hide the repository from the store public interface
type IChatsSuggestionsStore = IChatsSuggestions & { _repository: ChatsRepository }

/**
 * A store for managing a suggestions in chats.
 */
export const useChatSuggestions = create<IChatsSuggestionsStore>((set, get) => ({
  initialSuggestions: [],
  selectedSuggestion: '',

  _repository: new ChatsRepository(),

  set,

  async fetchInitialSuggestions() {
    const { _repository } = get()
    const response = await _repository.fetchInitialSuggestions()
    const { data } = response

    set(
      produce((state: IChatsSuggestions) => {
        state.initialSuggestions = data.suggestions
      })
    )
  },
}))
