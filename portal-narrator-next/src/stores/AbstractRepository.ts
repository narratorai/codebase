import { DatacenterRegion, deleteMavis, getMavis, patchMavis, postMavis, SearchParams } from '@/util/mavisClient'

interface IRemoteRepository<TItem, TCollection> {
  /** Create a new item */
  create(data: Record<string, unknown>, datacenterRegion?: DatacenterRegion): Promise<TItem>
  datacenterRegion?: DatacenterRegion

  /** Delete an item */
  delete(id: string, datacenterRegion?: DatacenterRegion): Promise<boolean>

  /** Get all items */
  getAll(params?: SearchParams, datacenterRegion?: DatacenterRegion): Promise<TCollection>

  /** Get an item by its ID */
  getById(id: string, datacenterRegion?: DatacenterRegion): Promise<TItem>

  remotePathOrUrl: string

  /** Update an existing item */
  update(id: string, data: Record<string, unknown>, datacenterRegion?: DatacenterRegion): Promise<TItem>
}

/**
 * Class to represent a repository that interacts with the Mavis API.
 */
export default abstract class AbstractRepository<Item, Collection> implements IRemoteRepository<Item, Collection> {
  remotePathOrUrl: string

  constructor(remotePathOrUrl: string) {
    this.remotePathOrUrl = remotePathOrUrl
  }

  getAll(params: SearchParams, datacenterRegion?: DatacenterRegion) {
    const url = this.remotePathOrUrl
    return getMavis<Collection>(url, { datacenterRegion, params })
  }

  getById(id: string, datacenterRegion?: DatacenterRegion) {
    const url = `${this.remotePathOrUrl}/${id}`
    return getMavis<Item>(url, { datacenterRegion })
  }

  create(data: Record<string, unknown>, datacenterRegion?: DatacenterRegion) {
    const url = this.remotePathOrUrl
    return postMavis<Item>(url, { data, datacenterRegion })
  }

  update(id: string, data: Record<string, unknown>, datacenterRegion?: DatacenterRegion) {
    const url = `${this.remotePathOrUrl}/${id}`
    return patchMavis<Item>(url, { data, datacenterRegion })
  }

  async delete(id: string, datacenterRegion?: DatacenterRegion) {
    const url = `${this.remotePathOrUrl}/${id}`
    await deleteMavis<boolean>(url, { datacenterRegion })
    return true
  }
}
