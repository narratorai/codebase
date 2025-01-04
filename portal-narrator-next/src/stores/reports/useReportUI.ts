import { produce } from 'immer'
import Cookies from 'js-cookie'
import { isNil } from 'lodash'
import { create } from 'zustand'

interface IReportUI {
  autoSave: boolean
  fullWidth: boolean
  isSaving: boolean
  readOnly: boolean

  toggleAutoSave(nextState?: boolean): void
  toggleFullWidth(): void
  toggleReadOnly(): void
  toggleSaving(nextState?: boolean): void
}

/**
 * A store for managing the glogal report UI state.
 */
const useReportUI = create<IReportUI>((set, get) => ({
  fullWidth: Cookies.getJSON('reports:full-width') ?? false,
  readOnly: Cookies.getJSON('reports:read-only') ?? false,
  autoSave: Cookies.getJSON('reports:auto-save') ?? true,
  isSaving: false,

  toggleFullWidth() {
    const { fullWidth: initialValue } = get()
    Cookies.set('reports:full-width', JSON.stringify(!initialValue))

    set(
      produce((state) => {
        state.fullWidth = !state.fullWidth
      })
    )
  },

  toggleReadOnly() {
    const { readOnly: initialValue } = get()
    Cookies.set('reports:read-only', JSON.stringify(!initialValue))

    set(
      produce((state) => {
        state.readOnly = !state.readOnly
      })
    )
  },

  toggleAutoSave() {
    const { autoSave: initialValue } = get()
    Cookies.set('reports:auto-save', JSON.stringify(!initialValue))

    set(
      produce((state) => {
        state.autoSave = !state.autoSave
      })
    )
  },

  toggleSaving(nextState?: boolean) {
    set(
      produce((state) => {
        state.isSaving = isNil(nextState) ? !state.isSaving : nextState
      })
    )
  },
}))

export default useReportUI
