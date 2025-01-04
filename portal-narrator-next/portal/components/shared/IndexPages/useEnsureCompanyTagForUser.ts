import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { ensureCompanyTagForUser } from 'components/shared/IndexPages/helpers'
import { useCreateCompanyTagMutation, useListCompanyTagsQuery } from 'graph/generated'
import { useCallback, useMemo, useState } from 'react'
import { reportError } from 'util/errors'

interface IUseEnsureCompanyTagForUserReturn {
  loading: boolean
  error: Error | null
  data?: any
}

interface ICallbackInput {
  tagName: string
}

interface ICallbackReturn {
  id?: string
}

export default function useEnsureCompanyTagForUser(): [
  ({ tagName }: ICallbackInput) => Promise<ICallbackReturn>,
  IUseEnsureCompanyTagForUserReturn,
] {
  const company = useCompany()
  const { user } = useUser()

  const [data, setData] = useState<IUseEnsureCompanyTagForUserReturn['data']>(undefined)
  const [loading, setLoading] = useState<IUseEnsureCompanyTagForUserReturn['loading']>(false)
  const [error, setError] = useState<IUseEnsureCompanyTagForUserReturn['error']>(null)

  const [createCompanyTag] = useCreateCompanyTagMutation()

  const { data: tagsResult, refetch: refetchTags } = useListCompanyTagsQuery({
    variables: { company_id: company?.id, user_id: user.id },
    fetchPolicy: 'cache-and-network',
  })
  const tags = useMemo(() => tagsResult?.company_tags || [], [tagsResult?.company_tags])

  const callback = useCallback(
    async ({ tagName }: ICallbackInput) => {
      setLoading(true)

      try {
        if (company.id && user.id && tagName) {
          setError(null)
          const resp = await ensureCompanyTagForUser({
            userId: user.id,
            companyId: company.id,
            tags,
            createCompanyTag,
            tagName,
          })

          // make sure tags are up to date after initializing
          await refetchTags()

          setData(resp)
          return resp
        }
      } catch (err) {
        setError(err as Error)
        reportError('Error: useEnsureCompanyTagForUser', err as Error, {
          tagName,
          tags,
          companyId: company?.id,
          userId: user?.id,
        })
      } finally {
        setLoading(false)
      }
    },
    [company, user?.id, tags, createCompanyTag, refetchTags]
  )

  return [
    callback,
    {
      loading,
      error,
      data,
    },
  ]
}
