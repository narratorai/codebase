import { produce } from 'immer'
import { uniqBy } from 'lodash'
import { create } from 'zustand'

import * as api from './activitiesApi'
import { IActivities } from './interfaces'

/**
 * A store for managing activities.
 */
const useActivities = create<IActivities>((set, get) => ({
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

  async searchActivities(params, datacenterRegion) {
    const { perPage, params: storeParams } = get()

    const savedParams = storeParams || {}

    const inputParams = params || {}

    const newParams = { ...savedParams, ...inputParams, perPage, page: 1 }

    const response = await api.getActivities(newParams, datacenterRegion)

    set({ ...response, params: newParams })

    return response
  },

  async getNextPage(datacenterRegion) {
    const { page, perPage, totalCount, data, params: storeParams } = get()
    if (page > 0 && page * perPage >= totalCount) return null
    const savedParams = storeParams || {}
    const params = { ...savedParams, page: page + 1, perPage }
    const response = await api.getActivities(params, datacenterRegion)

    const newData = uniqBy([...data, ...response.data], 'id')

    set(
      produce((state: IActivities) => {
        state.totalCount = response.totalCount
        state.page = response.page
        state.perPage = response.perPage
        state.data = newData
      })
    )

    return response
  },
}))

export default useActivities
