import { Button, Collapse, Result } from 'antd-next'
import { Box, Flex, Typography } from 'components/shared/jawns'
import OnboardingCard from 'components/shared/layout/OnboardingCard'
import { startCase } from 'lodash'
import styled from 'styled-components'
import { openChat } from 'util/chat'
import { colors } from 'util/constants'
import sanitize from 'util/sanitize'

import { AuthError } from './Provider'

interface Props {
  logout(o?: { returnTo: string }): void
  authError?: AuthError
  errorParams?: Record<string, string>
}

const LinkButton = styled.button`
  cursor: pointer;
  text-decoration: none;
  color: ${colors.blue500};

  &:hover {
    text-decoration: underline;
  }

  &:focus {
    outline-style: none;
  }
`

/**
 * Auth error screen, with a logout button
 */
const CallbackError = (props: Props) => {
  const error = sanitize(props.authError?.error || props.errorParams?.error || '')
  const error_description = sanitize(props.authError?.message || props.errorParams?.error_description || '')

  // If they don't have a user yet
  if (error === 'unauthorized' && error_description?.toLowerCase().includes('user not found')) {
    return (
      <Box>
        <OnboardingCard withLogo>
          <Typography mb={3}>
            Unfortunately this email address isn&apos;t associated with an active Narrator account.
          </Typography>
          <Typography mb={3}>
            If you believe this is an error, please contact <a href="mailto:support@narrator.ai">support@narrator.ai</a>
            .
          </Typography>
          <Typography mb={3}>
            If you&apos;d like to sign up for a new account, please reach out to{' '}
            <a href="mailto:contact@narrator.ai">contact@narrator.ai</a> and they&apos;ll get you set up.
          </Typography>

          <Flex justifyContent="space-between" alignItems="center">
            <Typography>Thank you!</Typography>
            <Button type="link" onClick={() => props.logout({ returnTo: '/' })}>
              Log Out
            </Button>
          </Flex>
        </OnboardingCard>
      </Box>
    )
  }

  // All other auth errors
  return (
    <Box data-public mb={2}>
      <Result
        status="error"
        title={error ? startCase(error) : 'Something Went Wrong'}
        subTitle={
          <div>
            <p>
              There was an error logging you in. Please log out and try again.
              <br />
              If the problem persists, please <LinkButton onClick={() => openChat()}>open a chat with us</LinkButton> or
              contact <a href="mailto:support@narrator.ai">support@narrator.ai</a>
            </p>
            <br />
            <p>Apologies for the inconvenience. Our team has been notified.</p>
          </div>
        }
        extra={
          <>
            <Button type="primary" onClick={() => props.logout({ returnTo: '/' })}>
              Logout
            </Button>
            {error_description ? (
              <Collapse style={{ maxWidth: '450px', margin: '50px auto' }}>
                <Collapse.Panel key="0" header={<small>Technical details</small>}>
                  <small>
                    <code data-private>{error_description}</code>
                  </small>
                </Collapse.Panel>
              </Collapse>
            ) : null}
          </>
        }
      />
    </Box>
  )
}

export default CallbackError
