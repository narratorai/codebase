import { IRemoteDataset } from '@/stores/datasets/interfaces'
import { DatacenterRegion, getMavis } from '@/util/mavisClient'

type DatasetsResponse = {
  total: number
  data: {
    id: string
    name: string
    slug: string
  }[]
}

export async function fetchDataset(datasetId: string, datacenterRegion: DatacenterRegion) {
  const url = `/api/datasets/${datasetId}`
  const response = await getMavis<IRemoteDataset>(url, { datacenterRegion })
  return response
}

export function fetchDatasets(datacenterRegion: DatacenterRegion) {
  return getMavis<DatasetsResponse>('/api/datasets', { datacenterRegion })
}
