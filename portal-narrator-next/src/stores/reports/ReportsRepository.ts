import { produce } from 'immer'
import { groupBy, isNil, map, reject } from 'lodash'

import { AppliedFilterNodeAttrs } from '@/components/shared/BlockEditor/extensions/Filter/hooks'
import { DatacenterRegion, deleteMavis, getMavis, patchMavis, postMavis } from '@/util/mavisClient'

import AbstractRepository from '../AbstractRepository'
import { ICompileNodeData, IRemoteReferencedDatasets, IRemoteReport, IRemoteReports } from './interfaces'

export default class ReportsRepository extends AbstractRepository<IRemoteReport, IRemoteReports> {
  constructor() {
    super('/api/reports')
  }

  /**
   * Update the content of a report.
   *
   * For performance reasons, the content is stored separately from the rest of the report.
   */
  updateContent = async (id: string, data: Partial<IRemoteReport>, datacenterRegion?: DatacenterRegion) => {
    const url = `${this.remotePathOrUrl}/${id}/content`
    return patchMavis<IRemoteReport>(url, { data, datacenterRegion })
  }

  favorite = async (id: string, datacenterRegion?: DatacenterRegion) => {
    const url = `${this.remotePathOrUrl}/${id}/favorite`

    await postMavis(url, { data: undefined, datacenterRegion })
    return true
  }

  unfavorite = async (id: string, datacenterRegion?: DatacenterRegion) => {
    const url = `${this.remotePathOrUrl}/${id}/favorite`

    await deleteMavis(url, { datacenterRegion })
    return true
  }

  /**
   * Compile a node in a report.
   */
  compileNode = async <T>(
    id: string,
    data: ICompileNodeData,
    filtersAttrs: AppliedFilterNodeAttrs[],
    datacenterRegion?: DatacenterRegion
  ) => {
    const nodeId = data.node.attrs['uid']
    const url = `${this.remotePathOrUrl}/${id}/nodes/${nodeId}/compile`

    const filtersWithValues = reject(filtersAttrs, (filter) => isNil(filter.value))
    const filtersAttrsById = groupBy(filtersWithValues, 'uid')
    const appliedFilters = map(filtersAttrsById, (filters, uid) => ({
      filterId: uid,
      appliedOn: filters.flatMap((filter) => filter.applyOn),
      filter: {
        operator: filters[0].operator,
        value: filters[0].value,
      },
    }))

    const dataWithFilters = produce(data, (draft) => {
      draft.runDetails = {
        ...draft.runDetails,
        appliedFilters,
      }
    })

    return postMavis<T, ICompileNodeData>(url, { data: dataWithFilters, datacenterRegion })
  }

  /**
   * Get all datasets used in a report.
   *
   * @param id
   * @param datacenterRegion
   * @returns
   */
  getReferencedDatasets = async (id: string, datacenterRegion?: DatacenterRegion) => {
    const url = `${this.remotePathOrUrl}/${id}/datasets`

    return getMavis<IRemoteReferencedDatasets>(url, { datacenterRegion })
  }

  /**
   * Update the run schedule of a report.
   *
   * @param id
   * @param data
   * @param datacenterRegion
   * @returns
   */
  updateSchedule = async (id: string, data: Record<string, string>, datacenterRegion?: DatacenterRegion) => {
    const url = `${this.remotePathOrUrl}/${id}/schedule`
    return patchMavis(url, { data, datacenterRegion })
  }
}
