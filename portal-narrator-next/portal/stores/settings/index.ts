import {
  IMapping,
  IMappings,
  IRemoteWarehouse,
  IRemoteWarehouseOption,
  ITransformation,
  WarehouseTypes,
} from './interfaces'
import { useAdminOnboarding } from './useAdminOnboarding'
import { useWarehouse } from './useWarehouse'

export { useAdminOnboarding, useWarehouse }
export type {
  IMapping,
  IMappings,
  ITransformation,
  IRemoteWarehouse as IWarehouse,
  IRemoteWarehouseOption as IWarehouseOption,
  WarehouseTypes,
}
