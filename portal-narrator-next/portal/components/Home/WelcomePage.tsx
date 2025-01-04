import { Button } from 'antd-next'
import { useAuth0 } from 'components/context/auth/hooks'
import { useUser } from 'components/context/user/hooks'
import { Box, Flex, Typography } from 'components/shared/jawns'
import OnboardingCard from 'components/shared/layout/OnboardingCard'
import { isEmpty, map } from 'lodash'
import { useHistory } from 'react-router'

import { getLogger } from '@/util/logger'

const logger = getLogger()

const WelcomePage = () => {
  const history = useHistory()
  const { user } = useUser()
  const { logout, authCompany } = useAuth0()

  if (!user) {
    return null
  }

  // if they only belong to one company
  // but they tried to go another company
  // send them back to root so auth provider sends them to right place
  if (user.company_users?.length === 1) {
    logger.warn(
      { redirectCompany: user.company_users[0].company.slug },
      'User has access to exactly one company, redirecting'
    )
    history.replace(`/${user.company_users[0].company.slug}`)
    return null
  }

  const hasNoCompanies = isEmpty(user?.company_users)

  return (
    <Box>
      <OnboardingCard withLogo>
        {hasNoCompanies ? (
          <Box data-test="welcome-page-no-companies">
            <Typography mb={2} data-private>
              <b>Welcome to Narrator!</b>
            </Typography>

            <Typography mb={1}>It does not look like you have access to any companies.</Typography>

            <Typography>
              If you believe this is a mistake, please reach out to your admin to confirm, or contact us at{' '}
              <a href="mailto:support@narrator.ai">support@narrator.ai</a>.
            </Typography>
          </Box>
        ) : (
          <Box data-test="welcome-page-company-options">
            <Typography mb={2} data-private>
              <b>Welcome back to Narrator!</b>
              <div>Please select one of your companies below to proceed:</div>
            </Typography>
            <ul style={{ paddingInlineStart: '2rem', marginBlockEnd: '1em' }}>
              {map(user.company_users, (companyUser) => (
                <li key={companyUser.id}>
                  <Typography>
                    <a
                      href={`/${companyUser.company.slug}`}
                      data-test="welcome-page-company-option-link"
                      style={{ fontWeight: companyUser.company.slug === authCompany ? 'bold' : undefined }}
                    >
                      {companyUser.company.name || companyUser.company.slug}
                    </a>
                  </Typography>
                </li>
              ))}
            </ul>
          </Box>
        )}

        <Flex justifyContent="space-between" alignItems="center" mt={3}>
          <Typography fontStyle="italic">Logged in as {user.email}</Typography>
          <Button onClick={() => logout({ returnTo: '/' })}>Log Out</Button>
        </Flex>
      </OnboardingCard>
    </Box>
  )
}

export default WelcomePage
