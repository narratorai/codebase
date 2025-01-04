import { produce } from 'immer'
import { uniqBy } from 'lodash'
import { create } from 'zustand'

import { IJourneyActivities } from './interfaces'
import * as api from './journeysApi'

/**
 * A store for managing journey activities.
 */
const useJourneyActivities = create<IJourneyActivities>((set, get) => ({
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

  async searchJourneyActivities(tableId, params, datacenterRegion) {
    const { perPage, params: storeParams } = get()

    const savedParams = storeParams || {}

    const inputParams = params || {}

    const newParams = { ...savedParams, ...inputParams, perPage, page: 1 }

    const response = await api.getJourneyActivities(tableId, newParams, datacenterRegion)

    set({ ...response, params: newParams })

    return response
  },

  async getNextPage(tableId, datacenterRegion) {
    const { page, perPage, totalCount, data, params: storeParams } = get()
    if (page > 0 && page * perPage >= totalCount) return null
    const savedParams = storeParams || {}
    const params = { ...savedParams, page: page + 1, perPage }
    const response = await api.getJourneyActivities(tableId, params, datacenterRegion)

    const newData = uniqBy([...data, ...response.data], 'id')

    set(
      produce((state: IJourneyActivities) => {
        state.totalCount = response.totalCount
        state.page = response.page
        state.perPage = response.perPage
        state.data = newData
      })
    )

    return response
  },
}))

export default useJourneyActivities
