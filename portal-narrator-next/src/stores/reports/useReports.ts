import { produce } from 'immer'
import { clamp } from 'lodash'
import { create } from 'zustand'

import { IReports } from './interfaces'
import ReportsRepository from './ReportsRepository'

const repository = new ReportsRepository()

const initialState = {
  totalCount: 0,
  page: 0,
  perPage: 50,
  data: [],
}

/**
 * A store for managing report collections.
 */
const useReports = create<IReports>((set) => ({
  ...initialState,

  set,

  reset() {
    set(initialState)
  },

  async getAll(params, datacenterRegion) {
    const response = await repository.getAll(params, datacenterRegion)
    set(response)

    return response
  },

  async createReport(data, datacenterRegion) {
    const response = await repository.create(data, datacenterRegion)

    set(
      produce((state) => {
        state.data.push(response)
        state.totalCount += 1
      })
    )

    return response
  },

  async deleteReport(id, datacenterRegion) {
    const success = await repository.delete(id, datacenterRegion)
    if (!success) return false

    set(
      produce((state: IReports) => {
        const removed = state.data.filter((report) => report.id !== id)
        state.totalCount -= clamp(removed.length, 0, Infinity)
      })
    )

    return true
  },

  async favoriteReport(id, datacenterRegion) {
    await repository.favorite(id, datacenterRegion)

    set(
      produce((state: IReports) => {
        const report = state.data.find((report) => report.id === id)
        if (report) report.favorited = true
      })
    )

    return true
  },

  async unfavoriteReport(id, datacenterRegion) {
    await repository.unfavorite(id, datacenterRegion)

    set(
      produce((state: IReports) => {
        const report = state.data.find((report) => report.id === id)
        if (report) report.favorited = false
      })
    )

    return true
  },

  async updateReportSchedule(id, data, datacenterRegion) {
    await repository.updateSchedule(id, data, datacenterRegion)
  },
}))

export default useReports
