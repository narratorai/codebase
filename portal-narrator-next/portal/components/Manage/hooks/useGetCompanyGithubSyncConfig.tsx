import { useCompany } from 'components/context/company/hooks'
import {
  IGetCompanyGithubSyncConfigQuery,
  useGetCompanyGithubSyncConfigQuery,
  useGetCompanyUsersQuery,
  useGetUserLazyQuery,
} from 'graph/generated'
import { useEffect, useMemo } from 'react'

interface IGetCompanyGithubSyncConfig {
  loading: boolean
  config?: IGetCompanyGithubSyncConfigQuery['company_github_sync'][number]
  installedBy?: string
}

export default function useGetCompanyGithubSyncConfig(): IGetCompanyGithubSyncConfig {
  const company = useCompany()

  const { data: companyGithubSyncConfigData, loading: companyGithubSyncConfigLoading } =
    useGetCompanyGithubSyncConfigQuery({ variables: { company_id: company.id } })

  const [doGetUser, { data: userData }] = useGetUserLazyQuery()
  const userEmail = userData?.user?.[0].email

  const { data: companyUsersData } = useGetCompanyUsersQuery({
    variables: { company_slug: company.slug },
  })

  const companyGitHubSyncConfig = companyGithubSyncConfigData?.company_github_sync?.[0]

  useEffect(() => {
    if (companyGitHubSyncConfig?.user_id) {
      doGetUser({ variables: { user_id: companyGitHubSyncConfig.user_id } })
    }
  }, [doGetUser, companyGitHubSyncConfig?.user_id])

  const githubInstalledBy = useMemo(() => {
    if (companyGitHubSyncConfig?.user_id) {
      const companyUser = companyUsersData?.company_users.find((cu) => cu.id === companyGitHubSyncConfig?.user_id)
      if (companyUser?.first_name || companyUser?.last_name) {
        return [companyUser.first_name, companyUser.last_name].join(' ')
      }
      return userEmail
    }
  }, [userEmail, companyUsersData?.company_users, companyGitHubSyncConfig?.user_id])

  return {
    loading: companyGithubSyncConfigLoading,
    config: companyGitHubSyncConfig,
    installedBy: githubInstalledBy,
  }
}
