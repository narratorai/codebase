import { produce } from 'immer'
import { create } from 'zustand'

interface IReportFilters {
  committed: Record<string, Record<string, string | null>>
  staged: Record<string, Record<string, string | null>>

  /** Stages a filter to be committed. */
  addToStage(id: string, value: Record<string, string | null> | null): void
  /** Commits the staged filters to the committed filters. */
  commit(): void
  /** Removes a filter from the staged filters. */
  removeFromStage(id: string): void
  /** Resets the committed and staged filters. */
  reset(): void
}

/**
 * A store for managing the glogal report filters state.
 */
const useReportFilters = create<IReportFilters>((set) => ({
  committed: {},
  staged: {},

  addToStage(id, filter) {
    set(
      produce((state) => {
        state.staged[id] = filter
      })
    )
  },

  commit() {
    set(
      produce((state: IReportFilters) => {
        Object.assign(state.committed, state.staged)
        state.staged = {}
      })
    )
  },

  removeFromStage(id) {
    set(
      produce((state) => {
        state.staged[id] = undefined
      })
    )
  },

  reset() {
    set(
      produce((state) => {
        state.committed = {}
        state.staged = {}
      })
    )
  },
}))

export default useReportFilters
