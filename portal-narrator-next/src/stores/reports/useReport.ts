import { produce } from 'immer'
import { isNil } from 'lodash'
import { create } from 'zustand'

import { IRemoteReport, IReport } from './interfaces'
import ReportsRepository from './ReportsRepository'

const repository = new ReportsRepository()

const initialState = {
  id: undefined,
  name: 'Untitled',
  description: undefined,
  content: undefined,
  favorited: false,
  createdAt: new Date(),
  updatedAt: null,
  lastViewedAt: undefined,
  lastRun: null,
  canEdit: false,
  scheduled: false,
  screenshot: null,
  tagIds: [],
}

/**
 * A store for managing a report.
 */
const useReport = create<IReport>((set, get) => ({
  ...initialState,
  set,

  reset() {
    set(initialState)
  },

  async get(id, datacenterRegion) {
    const response = await repository.getById(id, datacenterRegion)
    set(response)

    return response
  },

  async save(data, datacenterRegion) {
    const { id } = get()
    let response: IRemoteReport

    set(data)
    if (isNil(id)) response = await repository.create(data, datacenterRegion)
    else response = await repository.update(id, data, datacenterRegion)

    return response
  },

  async saveContent(data, datacenterRegion) {
    const { id } = get()
    if (isNil(id)) throw new Error("Can't save content without an ID")

    const response = await repository.updateContent(id, data, datacenterRegion)
    set(response)

    return response
  },

  delete(datacenterRegion) {
    const { id } = get()

    if (isNil(id)) return Promise.resolve(false)
    return repository.delete(id, datacenterRegion)
  },

  async favorite(datacenterRegion) {
    const { id } = get()
    if (isNil(id)) return false

    set(
      produce((state: IRemoteReport) => {
        state.favorited = true
      })
    )
    await repository.favorite(id, datacenterRegion)
    return true
  },

  async unfavorite(datacenterRegion) {
    const { id } = get()
    if (isNil(id)) return false

    set(
      produce((state: IRemoteReport) => {
        state.favorited = false
      })
    )

    await repository.unfavorite(id, datacenterRegion)
    return true
  },
}))

export default useReport
