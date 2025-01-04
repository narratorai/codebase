import { IDatacenter_Region_Enum } from 'graph/generated'

export type { IDatacenter_Region_Enum }

export interface IMapping {
  data_source: string | null
  schema_name: string | null
}

export interface IMappings {
  mappings: IMapping[]
}

export interface IRemoteOnboardingSources extends IMappings {
  data_sources: string[]
  schemas: string[]
}

export interface IRemoteOnboardingRun extends ITransformations {
  show_narrative: boolean
}

export interface IRemoteOnboarding extends IRemoteOnboardingSources, IRemoteOnboardingRun {}

export interface IAdminOnboarding extends IRemoteOnboarding {
  /** Set attributes on the model */
  set: (data: Partial<IRemoteOnboarding>) => void

  /** Reset the state */
  reset: () => void

  /** Fetch the model from the server */
  fetch: (datacenterRegion?: IDatacenter_Region_Enum | null) => Promise<boolean>

  /** Post mappings to the server */
  postMappings: (data: IMappings, datacenterRegion?: IDatacenter_Region_Enum | null) => Promise<boolean>
}

export enum WarehouseTypes {
  BigQuery = 'bigquery',
  Databricks = 'databricks',
  MsSQL = 'mssql_odbc',
  PostgreSQL = 'pg',
  Redshift = 'redshift',
  Snowflake = 'snowflake',
}

export interface ITransformation {
  name: string
  kind: string
}

export interface ITransformations {
  transformations: ITransformation[]
}

export interface IRemoteWarehouseConfig {
  schema: Record<string, unknown>
  uischema: Record<string, unknown>
}
export interface IRemoteWarehouseOption {
  type: WarehouseTypes
  name: string
  config: IRemoteWarehouseConfig
}

export interface IRemoteWarehouse extends IRemoteWarehouseOption {
  is_admin: boolean
  options: Record<string, unknown> | null
}

export interface IRemoteWarehouses {
  data_source: IRemoteWarehouse | null
  admin_data_source: IRemoteWarehouse | null
  allow_admin: boolean
}

export interface IRemoteWarehouseSaveResponse extends IRemoteWarehouse {
  id: number | null
  was_admin: boolean
  success: boolean
  message: string
  description: string | null
  narrative_to_show: string | null
}

export interface IRemoteWarehouseSaveParams {
  warehouse_language?: WarehouseTypes
}

export interface IRemoteWarehouseDeleteParams {
  is_admin: boolean
}

export interface IWarehouseData {
  options: IRemoteWarehouseOption[]
  adminWarehouse: IRemoteWarehouse | null
  nonAdminWarehouse: IRemoteWarehouse | null
  lastSave: IRemoteWarehouseSaveResponse | null
}

export interface IWarehouse extends IWarehouseData {
  /** Set attributes on the model */
  set: (data: Partial<IWarehouse>) => void

  /** Reset the state */
  reset: () => void

  setWarehouses: (option: IRemoteWarehouseOption | null) => void

  /** Fetch the supported warehouse connection configuration options from the server */
  getOptions: (datacenterRegion?: IDatacenter_Region_Enum | null) => Promise<boolean>

  /** Fetch the saved warehouse connection configuration from the server */
  getWarehouses: (warehouseType?: WarehouseTypes, datacenterRegion?: IDatacenter_Region_Enum | null) => Promise<boolean>

  /** Post the warehouse connection configuration to the server */
  saveWarehouse: (
    warehouse: IRemoteWarehouse,
    datacenterRegion?: IDatacenter_Region_Enum | null
  ) => Promise<IRemoteWarehouseSaveResponse>

  /** Delete the warehouse connection configuration from the server */
  deleteWarehouse: (isAdmin: boolean, datacenterRegion?: IDatacenter_Region_Enum | null) => Promise<void>
}
