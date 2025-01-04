import { produce } from 'immer'
import { find } from 'lodash'
import { create } from 'zustand'

import { ITables } from './interfaces'
import * as local from './tableIdCache'
import * as api from './tablesApi'

const initialState = {
  totalCount: 0,
  page: 0,
  perPage: 100,
  data: [],
  table: null,
}

/**
 * A store for managing tables.
 */
const useTables = create<ITables>((set, get) => ({
  ...initialState,

  set,

  reset: () => {
    set(initialState)
  },

  async getTables(datacenterRegion) {
    const { page, perPage, totalCount } = get()
    if (page > 0 && page * perPage >= totalCount) return null
    const params = { page: page + 1, perPage }
    const response = await api.getTables(params, datacenterRegion)

    const tableId = local.getTableId()

    const table = find(response.data, ['id', tableId]) || null

    if (!table) local.clearTableId()

    set(
      produce((state: ITables) => {
        state.totalCount = response.totalCount
        state.page = response.page
        state.perPage = response.perPage
        state.data = response.data
        state.table = table || response.data[0]
      })
    )

    return response.data
  },

  setTable(tableId) {
    const { data } = get()

    const table = find(data, ['id', tableId])

    if (!table) return

    local.setTableId(tableId)

    set(
      produce((state: ITables) => {
        state.table = table
      })
    )
  },

  getTable(tableId) {
    const { data } = get()
    const table = find(data, { id: tableId })
    if (table === undefined) return null
    return table
  },
}))

export default useTables
