import { useAuth0 } from 'components/context/auth/hooks'
import { useCompany } from 'components/context/company/hooks'
import { useOnboardingContext } from 'components/Onboarding/OnboardingProvider'
import { useCallback, useState } from 'react'
import { handleFormatMavisError, MavisError } from 'util/useCallMavis'

import { deleteTransformation } from './api'

interface IUseDeleteTransformationReturn {
  loading: boolean
  error: MavisError | null
  deleted: boolean
}

export default function useDeleteTransformation(): [(id: string) => void, IUseDeleteTransformationReturn] {
  const company = useCompany()
  const { getTokenSilently: getToken } = useAuth0()

  const [deleted, setDeleted] = useState<IUseDeleteTransformationReturn['deleted']>(false)
  const [loading, setLoading] = useState<IUseDeleteTransformationReturn['loading']>(false)
  const [error, setError] = useState<IUseDeleteTransformationReturn['error']>(null)
  const { refetchOnboardingData } = useOnboardingContext()

  const callback = useCallback(
    async (id: string) => {
      try {
        setLoading(true)

        if (!company.slug) {
          throw new Error('Delete Transformation Error: Company not Found')
        }

        await deleteTransformation({
          getToken,
          company,
          id,
        })

        setDeleted(true)

        // we need to refetch onboarding data once a transformation
        // is deleted, just in case we need to show the onboarding steps again
        refetchOnboardingData()
      } catch (err: any) {
        setError(handleFormatMavisError(err))
      }
      setLoading(false)
    },
    [getToken, company, refetchOnboardingData]
  )

  return [
    callback,
    {
      loading,
      deleted,
      error,
    },
  ]
}
