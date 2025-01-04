import type { DatacenterRegion } from '@/util/mavisClient'

export enum AccessRole {
  Admin = 'admin',
  CanUseSql = 'can_use_sql',
  CreateChat = 'create_chat',
  CreateDataset = 'create_dataset',
  CreateDatasetIntegration = 'create_dataset_integeration',
  CreateDatasetMaterializeView = 'create_dataset_materialize_view',
  CreateDatasetTraining = 'create_dataset_training',
  CreateReport = 'create_report',
  DownloadData = 'download_data',
  ManageApi = 'manage_api',
  ManageBilling = 'manage_billing',
  ManageConnection = 'manage_connection',
  ManageCustomFunction = 'manage_custom_function',
  ManageProcessing = 'manage_processing',
  ManageProcessingConfig = 'manage_processing_config',
  ManageTags = 'manage_tags',
  ManageTickets = 'manage_tickets',
  ManageTransformations = 'manage_transformations',
  ManageUsers = 'manage_users',
  UpdatePrivate = 'update_private',
  ViewActivities = 'view_activities',
  ViewBilling = 'view_billing',
  ViewChat = 'view_chat',
  ViewCustomerJourney = 'view_customer_journey',
  ViewDataset = 'view_dataset',
  ViewPrivate = 'view_private',
  ViewProcessing = 'view_processing',
  ViewReport = 'view_report',
}

export interface IRemoteUser {
  awaitingInvitation: boolean
  createdAt: string
  email: string
  firstName: string | null
  id: string
  invitationExpiresAt: string | null
  jobTitle: string | null
  lastName: string | null
  roles: string[]
  teamIds: string[]
}

export interface IRemoteUsers {
  data: IRemoteUser[]
  page: number
  perPage: number
  totalCount: number
}

export interface IRemoteBasicActivity {
  id: string
  name: string
  tableId: string
}

export interface IRemoteBasicItem {
  id: string
  name: string
}

export interface IRemoteUserFavorites {
  activities: IRemoteBasicActivity[]
  chats: IRemoteBasicItem[]
  datasets: IRemoteBasicItem[]
  reports: IRemoteBasicItem[] // TODO: This will be replaced with IRemoteReportItem which extends IRemoteBasicItem
}

export interface IRemoteUserCompany {
  id: string
  name: string
  slug: string
}

export interface IRemoteUserDetails {
  accessRoles: AccessRole[]
  companies: IRemoteUserCompany[]
  favorites: IRemoteUserFavorites
  teamIds: string[]
}

export interface IAccessRoles {
  Admin: boolean
  CanUseSql: boolean
  CreateChat: boolean
  CreateDataset: boolean
  CreateDatasetIntegration: boolean
  CreateDatasetMaterializeView: boolean
  CreateDatasetTraining: boolean
  CreateReport: boolean
  DownloadData: boolean
  ManageApi: boolean
  ManageBilling: boolean
  ManageConnection: boolean
  ManageCustomFunction: boolean
  ManageProcessing: boolean
  ManageProcessingConfig: boolean
  ManageTags: boolean
  ManageTickets: boolean
  ManageTransformations: boolean
  ManageUsers: boolean
  UpdatePrivate: boolean
  ViewActivities: boolean
  ViewBilling: boolean
  ViewChat: boolean
  ViewCustomerJourney: boolean
  ViewDataset: boolean
  ViewPrivate: boolean
  ViewProcessing: boolean
  ViewReport: boolean
}

export interface IUserDetails {
  accessRoles: IAccessRoles
  companies: IRemoteUserCompany[]
  favorites: IRemoteUserFavorites | null
  teamIds: string[]
}

export interface IUser extends IUserDetails {
  /** Get all the seed data for the user model */
  getCurrentUserSeed: (datacenterRegion?: DatacenterRegion) => Promise<IRemoteUserDetails>

  /** Reset the state */
  reset: () => void

  /** Set attributes on the model */
  set: (attributes: Partial<Pick<IUser, 'accessRoles' | 'companies' | 'favorites' | 'teamIds'>>) => void
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IUsers extends IRemoteUsers {}
