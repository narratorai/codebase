import { produce } from 'immer'
import { create } from 'zustand'

import { IAdminOnboarding } from './interfaces'
import SettingsRepository from './SettingsRepository'

// Typed created to hide the repository from the store public interface
type IAdminOnboardingStore = IAdminOnboarding & { _repository: SettingsRepository }

/**
 * A store for managing admin onboarding.
 */
export const useAdminOnboarding = create<IAdminOnboardingStore>((set, get) => ({
  data_sources: [],
  schemas: [],
  mappings: [],
  show_narrative: false,
  transformations: [],

  _repository: new SettingsRepository(),

  set,

  reset() {
    set({
      data_sources: [],
      schemas: [],
      mappings: [],
      show_narrative: false,
      transformations: [],
    })
  },

  async fetch(datacenterRegion) {
    const { _repository } = get()
    const response = await _repository.getAdminOnboardingSources(datacenterRegion)
    const { data_sources, schemas, mappings } = response.data

    set(
      produce((state: IAdminOnboarding) => {
        state.data_sources = data_sources
        state.schemas = schemas
        state.mappings = mappings
      })
    )

    return true
  },

  async postMappings(data, datacenterRegion) {
    const { _repository } = get()
    const response = await _repository.postAdminOnboardingMappings(data, datacenterRegion)
    const { show_narrative, transformations } = response.data

    set(
      produce((state: IAdminOnboarding) => {
        state.show_narrative = show_narrative
        state.transformations = transformations
      })
    )

    return true
  },
}))
