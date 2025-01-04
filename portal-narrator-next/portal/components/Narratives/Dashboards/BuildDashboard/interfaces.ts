import {
  CONTENT_TYPE_IMAGE_UPLOAD,
  CONTENT_TYPE_MARKDOWN,
  CONTENT_TYPE_MEDIA_UPLOAD,
  CONTENT_TYPE_METRIC_V2,
  CONTENT_TYPE_PLOT_V2,
  CONTENT_TYPE_TABLE_V2,
} from 'util/narratives/constants'

export type AllContentTypes =
  | typeof CONTENT_TYPE_MARKDOWN
  | typeof CONTENT_TYPE_METRIC_V2
  | typeof CONTENT_TYPE_PLOT_V2
  | typeof CONTENT_TYPE_TABLE_V2
  | typeof CONTENT_TYPE_IMAGE_UPLOAD
  | typeof CONTENT_TYPE_MEDIA_UPLOAD
export interface IBuildDashboardContext {
  selectedTab: string
  selectedSectionIndex: number
  newContentItemId?: string
}
