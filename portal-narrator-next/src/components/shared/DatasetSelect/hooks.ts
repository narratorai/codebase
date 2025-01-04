import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { useCompany } from '@/stores/companies'
import { IRemoteDataset } from '@/stores/datasets/interfaces'

import { fetchDataset } from './ajax'

/**
 * Hook to fetch a dataset by ID.
 *
 * @param datasetId ID of the dataset
 * @param options useQuery options
 * @returns
 */
export function useDatasetQuery(datasetId: string, options?: Partial<UseQueryOptions<IRemoteDataset>>) {
  const [companySlug, datacenterRegion] = useCompany((state) => [state.slug, state.datacenterRegion])

  return useQuery({
    queryFn: () => fetchDataset(datasetId, datacenterRegion),
    queryKey: [companySlug, 'datasets', datasetId],
    staleTime: 1000 * 60 * 5,
    ...options,
  })
}
