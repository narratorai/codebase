import { Button, Result } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { MobileBreadcrumb } from 'components/Navbar/MobileBreadcrumbs'
import MobileTopNavbar from 'components/Navbar/MobileTopNavbar'
import { Box, Link, Typography } from 'components/shared/jawns'
import LogoSVG from 'static/img/logo.svg'
import styled from 'styled-components'
import { breakpoints, zIndex } from 'util/constants'

interface Props {
  mobileFriendly: boolean
  breadcrumbs?: MobileBreadcrumb[]
}

const StyledContainer = styled(({ ...props }) => <div {...props} />)`
  position: fixed;
  z-index: ${zIndex.overlay + 1};
  inset: 0;
  background-color: white;
  overflow: hidden;

  @media only screen and (min-width: ${breakpoints.md}) {
    display: none;
  }
`

const MobileNotSupported = ({ mobileFriendly = false, breadcrumbs = [] }: Props) => {
  const company = useCompany()

  if (mobileFriendly) return null
  return (
    <StyledContainer id="smallScreenMsg" data-test="mobile-support-warning">
      <MobileTopNavbar breadcrumbs={breadcrumbs} />
      <Result
        status="warning"
        extra={
          <div style={{ textAlign: 'center' }}>
            <Typography type="title400" color="gray500" mb={4}>
              Narrator portal is best experienced on a desktop screen
            </Typography>
            <Box>
              <LogoSVG style={{ width: 50 }} />
            </Box>

            {company && (
              <Box mt={3}>
                <Link to="/narratives">
                  <Button type="primary">Go to Narratives</Button>
                </Link>
              </Box>
            )}
          </div>
        }
      />
    </StyledContainer>
  )
}

export default MobileNotSupported
