import {
  DefaultError,
  GetNextPageParamFunction,
  InfiniteData,
  QueryFunctionContext,
  QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'
import { flatten, last, map } from 'lodash'
import { useCallback } from 'react'

import { useDelayedState } from '@/hooks'
import { useCompany } from '@/stores/companies'
import { DatasetsRepository, IRemoteDatasets, IRemoteDatasetsSearchParams } from '@/stores/datasets'

const PAGE_SIZE = 50
const PAGE_STEP = 1
const INITIAL_TOTAL_COUNT = 0

const repository = new DatasetsRepository()

const useSearchQuery = () => {
  const [companySlug, datacenterRegion] = useCompany((state) => [state.slug, state.datacenterRegion])
  const [search, setSearch] = useDelayedState('')

  const getNextPageParam: GetNextPageParamFunction<IRemoteDatasetsSearchParams, IRemoteDatasets> = (lastPage) =>
    lastPage.page * PAGE_SIZE < lastPage.totalCount
      ? { search, perPage: PAGE_SIZE, page: lastPage.page + PAGE_STEP }
      : null

  const queryFn = useCallback(
    async (context: QueryFunctionContext<QueryKey, IRemoteDatasetsSearchParams>) => {
      const { pageParam } = context
      const response = await repository.getAll(pageParam, datacenterRegion)
      return response
    },
    [datacenterRegion]
  )

  const { data, ...state } = useInfiniteQuery<
    IRemoteDatasets,
    DefaultError,
    InfiniteData<IRemoteDatasets>,
    QueryKey,
    IRemoteDatasetsSearchParams
  >({
    initialPageParam: { search, perPage: PAGE_SIZE, page: PAGE_STEP },
    getNextPageParam,
    queryFn,
    queryKey: [companySlug, 'datasets', search],
  })

  const lastPage = last(data?.pages)
  const datasets = flatten(map(data?.pages, 'data'))

  const newData = {
    data: datasets ?? [],
    totalCount: lastPage?.totalCount ?? INITIAL_TOTAL_COUNT,
    page: lastPage?.page ?? PAGE_STEP,
    perPage: lastPage?.perPage ?? PAGE_SIZE,
  }

  return {
    ...state,
    setSearch,
    data: newData,
  }
}

export default useSearchQuery
