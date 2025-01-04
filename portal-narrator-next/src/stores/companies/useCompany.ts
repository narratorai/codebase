import { create } from 'zustand'

import { DatacenterRegion } from '@/util/mavisClient'

import CompanyRepository from './CompanyRepository'
import { CompanyStatus, ICompany } from './interfaces'

const repository = new CompanyRepository()
const initialState = {
  batchHalt: false,
  createdAt: '',
  currency: 'USD',
  datacenterRegion: 'US' as DatacenterRegion,
  id: '',
  locale: 'en-US',
  logoUrl: null,
  name: '',
  productionSchema: '',
  slug: '',
  status: CompanyStatus.Active,
  teams: [],
  tags: [],
  users: [],
  timezone: '',
  timeZone: '',
  updatedAt: '',
  warehouseLanguage: '',
}

/**
 * A store for managing company.
 */
const useCompany = create<ICompany>((set) => ({
  ...initialState,

  async get(id = 'current') {
    const company = await repository.getById(id)

    const newState = { ...company, timeZone: company.timezone }

    set(newState)
    return newState
  },

  reset() {
    set(initialState)
  },

  set,
}))

export default useCompany
