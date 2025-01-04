import { IListCompanyTagsQuery, IListDashboardsQuery } from 'graph/generated'

export type DashboardsType = IListDashboardsQuery['narrative']
export type DashboardType = DashboardsType[number]

export enum OverlayNames {
  OVERLAY_UPDATE = 'update',
  OVERLAY_DUPLICATE = 'duplicate',
  OVERLAY_UPDATE_CONFIG = 'config',
  OVERLAY_DELETE = 'delete',
  OVERLAY_TEMPLATE_SAVE = 'template-save',
}

export interface OverlayProps {
  name: OverlayNames
  dashboard?: DashboardType
}

export interface IDashboardImage {
  id: string
  image: string
}

export interface IDashboardIndexContent {
  allDashboards?: DashboardsType
  tags?: IListCompanyTagsQuery['company_tags']
  sharedTags?: IListCompanyTagsQuery['company_tags']
  dashboardsImages?: IDashboardImage[]
  loadingDashboardImages?: boolean
  dashboardsDoneSuccessfullyLoading?: boolean
  handleOpenUpdateOverlay: (dashboard: DashboardType) => void
  handleOpenDeleteOverlay: (dashboard: DashboardType) => void
  handleOpenConfigOverlay: (dashboard: DashboardType) => void
  handleOpenDuplicateOverlay: (dashboard: DashboardType) => void
  handleOpenSaveTemplateOverlay: () => void
  handleCloseOverlay: () => void
  setRefreshIndex: (value: boolean) => void
}
