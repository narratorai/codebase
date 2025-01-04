import { useCompany } from 'components/context/company/hooks'
import {
  ITransformation,
  useGetTransformationByIdQuery,
  useListTransformationsNeedsUpdateSubscription,
  useTransformationIndexQuery,
} from 'graph/generated'
import { isEmpty } from 'lodash'

export function useTransformation(transformationId?: string) {
  const { data } = useGetTransformationByIdQuery({
    variables: { id: transformationId },
    skip: !transformationId,
  })

  return data?.transformation[0] as ITransformation
}

export function useAllTransformations() {
  const { slug: companySlug } = useCompany()
  const { data, loading, refetch } = useTransformationIndexQuery({
    variables: { company_slug: companySlug },
  })

  const handleRefetchTransformation = () => {
    // only refetch if the query has run at least once
    // (don't want to fire on initial return of useListTransformationsNeedsUpdateSubscription)
    if (!isEmpty(data)) refetch()
  }

  useListTransformationsNeedsUpdateSubscription({
    variables: { company_slug: companySlug },
    onData: handleRefetchTransformation,
  })

  return { data: data?.all_transformations || [], loading }
}
