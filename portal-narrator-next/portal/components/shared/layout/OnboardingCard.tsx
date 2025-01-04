import { Box, BoxProps, Flex } from 'components/shared/jawns'
import React from 'react'
import LogoSVG from 'static/img/logo.svg'
import styled from 'styled-components'

const Card = styled(Box)`
  position: relative;
  z-index: 1;

  /* border-radius & box-shadow matches auth0 login */
  border-radius: 5px;
  box-shadow: 0 12px 40px rgb(0 0 0 / 12%);
`

type OnboardingCardProps = BoxProps & {
  withLogo?: boolean
}

const OnboardingCard: React.FC<OnboardingCardProps> = ({ children, ...props }) => (
  <Flex alignItems="center" flexDirection="column" p={[3, 3, 5]}>
    <Card bg="white" p={[4, 4, 5]} width={'100%'} maxWidth={'500px'} {...props}>
      {props.withLogo && (
        <Flex justifyContent="space-around" mb={3}>
          <LogoSVG style={{ width: 50, height: 50 }} />
        </Flex>
      )}
      {children}
    </Card>
  </Flex>
)

export default OnboardingCard
