import { deleteMavis, fetchMavis, postMavis } from 'util/ajax'

import {
  IDatacenter_Region_Enum,
  IMappings,
  IRemoteOnboardingRun,
  IRemoteOnboardingSources,
  IRemoteWarehouse,
  IRemoteWarehouseDeleteParams,
  IRemoteWarehouseOption,
  IRemoteWarehouses,
  IRemoteWarehouseSaveParams,
  IRemoteWarehouseSaveResponse,
} from './interfaces'

export default class SettingsRepository {
  async getAdminOnboardingSources(datacenterRegion?: IDatacenter_Region_Enum | null) {
    return fetchMavis<IRemoteOnboardingSources>('/admin/v1/onboarding/sources', {
      datacenterRegion,
    })
  }

  async postAdminOnboardingMappings(data: IMappings, datacenterRegion?: IDatacenter_Region_Enum | null) {
    return postMavis<IRemoteOnboardingRun, IMappings>('/admin/v1/onboarding/run', {
      data,
      datacenterRegion,
    })
  }

  async getWarehouseOptions(datacenterRegion?: IDatacenter_Region_Enum | null) {
    return fetchMavis<IRemoteWarehouseOption[]>('/admin/v1/company/warehouse_options', { datacenterRegion })
  }

  async getWarehouse(params: IRemoteWarehouseSaveParams, datacenterRegion?: IDatacenter_Region_Enum | null) {
    return fetchMavis<IRemoteWarehouses, IRemoteWarehouseSaveParams>('/admin/v1/company/get_warehouse', {
      params,
      datacenterRegion,
    })
  }

  async saveWarehouse(data: IRemoteWarehouse, datacenterRegion?: IDatacenter_Region_Enum | null) {
    return postMavis<IRemoteWarehouseSaveResponse, IRemoteWarehouse>('/admin/v1/company/connections/save', {
      data,
      datacenterRegion,
    })
  }

  async deleteWarehouse(params: IRemoteWarehouseDeleteParams, datacenterRegion?: IDatacenter_Region_Enum | null) {
    return deleteMavis<void, IRemoteWarehouseDeleteParams>('/admin/v1/company/warehouse', {
      params,
      datacenterRegion,
    })
  }
}
