import { DatacenterRegion, postMavis } from '@/util/mavisClient'

import AbstractRepository from '../AbstractRepository'
import { IRemoteDataset, IRemoteDatasetOptionsReturnMessage, IRemoteDatasets, IRemoteOutputConfig } from './interfaces'

type TDownloadData = Pick<IRemoteOutputConfig, 'appliedFilters'>

type TDuplicateData = { name: string } & Pick<IRemoteOutputConfig, 'appliedFilters'>

type TDuplicateReturn = { id: string }

class DatasetsRepository extends AbstractRepository<IRemoteDataset, IRemoteDatasets> {
  constructor() {
    super('/api/datasets')
  }

  async download(
    datasetId: string,
    tabSlug: string,
    format: 'csv' | 'xls',
    data: TDownloadData,
    datacenterRegion?: DatacenterRegion
  ) {
    const url = `${this.remotePathOrUrl}/${datasetId}/tab/${tabSlug}/download?format=${format}`
    return postMavis<Blob, TDownloadData>(url, { data, datacenterRegion })
  }

  async asyncDownload(
    datasetId: string,
    tabSlug: string,
    format: 'csv' | 'xls',
    data: TDownloadData,
    datacenterRegion?: DatacenterRegion
  ) {
    const url = `${this.remotePathOrUrl}/${datasetId}/tab/${tabSlug}/async_download?format=${format}`
    return postMavis<IRemoteDatasetOptionsReturnMessage, TDownloadData>(url, { data, datacenterRegion })
  }

  async sendToGoogleSheets(datasetId: string, tabSlug: string, sheetKey: string, datacenterRegion?: DatacenterRegion) {
    const url = `${this.remotePathOrUrl}/${datasetId}/tab/${tabSlug}/send_to_gsheet?sheet_key=${sheetKey}`
    return postMavis<IRemoteDatasetOptionsReturnMessage, null>(url, { data: null, datacenterRegion })
  }

  async duplicate(datasetId: string, data: TDuplicateData, datacenterRegion?: DatacenterRegion) {
    const url = `${this.remotePathOrUrl}/${datasetId}/duplicate`
    return postMavis<TDuplicateReturn, TDuplicateData>(url, { data, datacenterRegion })
  }
}

export default DatasetsRepository
