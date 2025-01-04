import { CheckOutlined, GithubOutlined } from '@ant-design/icons'
import { Button, Card } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import useGetCompanyGithubSyncConfig from 'components/Manage//hooks/useGetCompanyGithubSyncConfig'
import { SimpleLoader } from 'components/shared/icons/Loader'
import { Box, Flex, Link, Typography } from 'components/shared/jawns'
import { useMemo } from 'react'
import { colors, semiBoldWeight } from 'util/constants'
import { shortDate } from 'util/helpers'

const Connections = () => {
  const company = useCompany()
  const { user } = useUser()

  const {
    config: companyGitHubSyncConfig,
    installedBy: githubInstalledBy,
    loading: companyGithubSyncConfigLoading,
  } = useGetCompanyGithubSyncConfig()

  const githubState = useMemo(() => {
    return btoa(
      JSON.stringify({
        company: company.slug,
        user: user.email,
        fromUrl: window.location.href,
      })
    )
  }, [company.slug, user.email])

  if (companyGithubSyncConfigLoading) {
    return <SimpleLoader />
  }

  const { name } = company
  const companyHasGitHubInstallation = !!companyGitHubSyncConfig?.installation_id

  return (
    <Box pb={8}>
      <Card bordered={false}>
        <Flex mb="24px" justifyContent="space-between" flexWrap="wrap" data-public>
          <Box mb={2}>
            <Box>
              <Typography type="title300" fontWeight={semiBoldWeight}>
                {name}&apos;s Connections
              </Typography>
            </Box>
          </Box>
          <Box mb={3}>
            <Typography>
              <a
                href="https://docs.narrator.ai/docs/invite-users#permissions-by-user-role"
                target="_blank"
                rel="noreferrer"
              >
                See here
              </a>
              <span> for documentation on Narrator connections</span>
            </Typography>
          </Box>
        </Flex>

        <Card
          title={
            <Typography type="title300">
              <GithubOutlined style={{ marginRight: '0.5em' }} />
              GitHub
              {companyHasGitHubInstallation && (
                <CheckOutlined style={{ marginLeft: '0.5em', fontSize: '0.75em', color: colors.green500 }} />
              )}
            </Typography>
          }
        >
          <Flex justifyContent="space-between">
            <Box mr={2}>
              <Typography type="body50" mb={2}>
                Connecting to GitHub enables a Pull Request workflow for managing and auditing changes to your
                transformation definitions and configuration.
              </Typography>

              <Typography
                as="a"
                type="body50"
                href="https://docs.narrator.ai/docs/invite-users#permissions-by-user-role"
                target="_blank"
                rel="noreferrer"
              >
                Click here for more details on Narrator&apos;s GitHub integration
              </Typography>
            </Box>

            <Box>
              <Link
                href={`https://github.com/apps/${process.env.NEXT_PUBLIC_GITHUB_SYNC_APP_NAME}/installations/new?state=${githubState}`}
                target={companyHasGitHubInstallation ? '_blank' : undefined}
                rel={companyHasGitHubInstallation ? 'noreferrer' : undefined}
              >
                <Button block icon={<GithubOutlined />}>
                  {companyHasGitHubInstallation ? 'Manage GitHub Integration' : 'Connect to GitHub'}
                </Button>
              </Link>

              {companyHasGitHubInstallation && githubInstalledBy && (
                <Typography type="body200" fontStyle="italic" mt={1} textAlign="right">
                  Installed by {githubInstalledBy}
                  <br />
                  on {shortDate(companyGitHubSyncConfig.created_at)}
                </Typography>
              )}
            </Box>
          </Flex>
        </Card>
      </Card>
    </Box>
  )
}

export default Connections
