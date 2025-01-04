import { JSONContent } from '@tiptap/core'

import { IRemoteSimplePlot } from '@/stores/datasets'
import { DatacenterRegion, SearchParams } from '@/util/mavisClient'

export interface IReportNodeCompileContext {
  appliedFilters?: {
    filterId: string
    appliedOn: unknown[]
    filter: {
      operator: string
      value: unknown
    }
  }[]
  reportId: string
  runKey?: string
}

export interface ICompileNodeData {
  node: {
    type: string
    attrs: Record<string, unknown>
  }
  runDetails: Omit<IReportNodeCompileContext, 'reportId'>
}

export interface FilterCompileResponse {
  content: {
    constraintList: (string | unknown)[]
    defaultValue: string | null
    isEditable: boolean
  }
  type: 'filter'
}

export interface DatasetMetricCompileResponse {
  content: {
    title: string
    currentValue: number
    comparisonValue: number
    format: string
    plotData: IRemoteSimplePlot | null
  }
  type: 'datasetMetric'
}

export interface DecisionCompileResponse {
  content: {
    value: string | null
    content: JSONContent
  }
  type: 'filter'
}

export interface IRemoteReferencedDatasets {
  data: {
    dataset: {
      id: string
      name: string
      description?: string
      activities: string[]
    }
    tabSlugs: string[]
  }[]
  totalCount: number
}

export interface IRemoteReportContentMeta {
  wordCount: number
}

export interface IRemoteReportContent {
  document: {
    type: string
    content?: JSONContent[]
    meta: IRemoteReportContentMeta
  }
}

export interface ILastRun {
  createdAt: string | Date
  key: string
}

export interface IRemoteReport {
  canEdit: boolean
  content?: IRemoteReportContent
  createdAt: string | Date
  description?: string | null
  favorited: boolean
  id?: string
  lastRun: ILastRun | null
  lastViewedAt?: string
  name: string
  scheduled: boolean
  screenshot: {
    attachmentId: string
    fileExtension: string
  } | null
  tagIds: string[]
  updatedAt: string | Date | null
}

export interface IRemoteReports {
  data: Omit<IRemoteReport, 'content'>[]
  page: number
  perPage: number
  totalCount: number
}

export type TSaveReportData = Omit<IRemoteReport, 'id'>

export interface IReport extends IRemoteReport {
  /** Delete the model from the server */
  delete: (datacenterRegion?: DatacenterRegion) => Promise<boolean>

  /** Mark the report as favorite */
  favorite: (datacenterRegion?: DatacenterRegion) => Promise<boolean>

  /** Get the model from the server */
  get: (id: string, datacenterRegion?: DatacenterRegion) => Promise<IRemoteReport>

  /** Reset the model */
  reset: () => void

  /** Save the model attributes, except the content */
  save: (data: Partial<TSaveReportData>, datacenterRegion?: DatacenterRegion) => Promise<IRemoteReport>

  /** Save the report content */
  saveContent: (data: Partial<TSaveReportData>, datacenterRegion?: DatacenterRegion) => Promise<IRemoteReport>

  /** Set attributes on the model */
  set: (attributes: Partial<IRemoteReport>) => void

  /** Remove the favorite mark from the report */
  unfavorite: (datacenterRegion?: DatacenterRegion) => Promise<boolean>
}

export interface IReports extends IRemoteReports {
  createReport: (data: Partial<TSaveReportData>, datacenterRegion?: DatacenterRegion) => Promise<IRemoteReport>

  deleteReport: (reportId: string, datacenterRegion?: DatacenterRegion) => Promise<boolean>

  favoriteReport: (reportId: string, datacenterRegion?: DatacenterRegion) => Promise<boolean>

  getAll(params: SearchParams, datacenterRegion?: DatacenterRegion): Promise<IRemoteReports>

  /** Reset the collection */
  reset: () => void

  /** Set attributes on the collection */
  set: (attributes: Partial<IRemoteReports>) => void

  unfavoriteReport: (reportId: string, datacenterRegion?: DatacenterRegion) => Promise<boolean>

  updateReportSchedule: (
    reportId: string,
    data: Record<string, string>,
    datacenterRegion?: DatacenterRegion
  ) => Promise<void>
}
