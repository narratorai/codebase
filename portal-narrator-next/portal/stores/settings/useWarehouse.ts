import { produce } from 'immer'
import { create } from 'zustand'

import { IWarehouse } from './interfaces'
import SettingsRepository from './SettingsRepository'

// Typed created to hide the repository from the store public interface
type IWarehouseStore = IWarehouse & { _repository: SettingsRepository }

/**
 * A store for managing warehouses.
 */
export const useWarehouse = create<IWarehouseStore>((set, get) => ({
  options: [],
  adminWarehouse: null,
  nonAdminWarehouse: null,
  lastSave: null,

  _repository: new SettingsRepository(),

  set,

  reset() {
    set({
      options: [],
      adminWarehouse: null,
      nonAdminWarehouse: null,
      lastSave: null,
    })
  },

  setWarehouses: (option) => {
    const adminWarehouse = option !== null ? { ...option, is_admin: true, options: null } : null
    const nonAdminWarehouse = option !== null ? { ...option, is_admin: false, options: null } : null

    set(
      produce((state: IWarehouse) => {
        state.adminWarehouse = adminWarehouse
        state.nonAdminWarehouse = nonAdminWarehouse
      })
    )
  },

  async getOptions(datacenterRegion) {
    const { _repository } = get()
    const response = await _repository.getWarehouseOptions(datacenterRegion)
    const options = response.data

    set(
      produce((state: IWarehouse) => {
        state.options = options
      })
    )

    return true
  },

  async getWarehouses(warehouseType, datacenterRegion) {
    const { _repository } = get()
    const params = warehouseType ? { warehouse_language: warehouseType } : {}
    const response = await _repository.getWarehouse(params, datacenterRegion)
    const warehouses = response.data

    set(
      produce((state: IWarehouse) => {
        state.adminWarehouse = warehouses.admin_data_source
        state.nonAdminWarehouse = warehouses.data_source
      })
    )

    return true
  },

  async saveWarehouse(warehouse, datacenterRegion) {
    const { _repository } = get()
    const saved = await _repository.saveWarehouse(warehouse, datacenterRegion)
    const savedWarehouse = saved.data
    const isAdmin = savedWarehouse.is_admin

    set(
      produce((state: IWarehouse) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        if (isAdmin) state.adminWarehouse!.options = savedWarehouse.options
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        else state.nonAdminWarehouse!.options = savedWarehouse.options
        state.lastSave = savedWarehouse
      })
    )

    return savedWarehouse
  },

  async deleteWarehouse(isAdmin, datacenterRegion) {
    const { _repository } = get()
    const params = { is_admin: isAdmin }
    await _repository.deleteWarehouse(params, datacenterRegion)

    set(
      produce((state: IWarehouse) => {
        if (isAdmin) state.adminWarehouse = null
        if (!isAdmin) state.nonAdminWarehouse = null
      })
    )
  },
}))
