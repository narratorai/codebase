import { Layout } from 'antd-next'
import { LayoutProps } from 'antd-next/es/layout'
import { MobileBreadcrumb } from 'components/Navbar/MobileBreadcrumbs'
import MobileTopNavbar from 'components/Navbar/MobileTopNavbar'
import MobileNotSupported from 'components/shared/layout/MobileNotSupported'
import Head from 'next/head'
import { useEffect } from 'react'
import styled from 'styled-components'
import { hideChatButton, showChatButton } from 'util/chat'
import { breakpoints } from 'util/constants'
import useBreakpoint from 'util/useBreakpoint'

const StyledLayout = styled(({ mobileFriendly, bg, ...props }) => <Layout {...props} />)`
  min-height: 100vh;
  background: ${({ bg }) => bg};

  @media only screen and (max-width: ${breakpoints.md}) {
    visibility: ${({ mobileFriendly }) => (mobileFriendly ? 'visible' : 'hidden')};
  }
`

interface Props extends LayoutProps {
  title?: string
  /** Allows us to decide which pages should have the HelpScout chat beacon hidden by default */
  hideChat?: boolean
  bg?: string
  mobileFriendly?: boolean
  breadcrumbs?: MobileBreadcrumb[]
}

const Page = ({
  children,
  hideChat = false,
  title = 'Portal | Narrator',
  bg = 'white',
  mobileFriendly = false,
  breadcrumbs = [],
  ...props
}: Props) => {
  const { isMobile } = useBreakpoint()

  useEffect(() => {
    if (hideChat) {
      hideChatButton()
    } else {
      showChatButton()
    }
  }, [hideChat])

  return (
    <>
      <Head>
        <title key="title">{title}</title>
      </Head>

      {!mobileFriendly && <MobileNotSupported mobileFriendly={mobileFriendly} breadcrumbs={breadcrumbs} />}

      <StyledLayout bg={bg} mobileFriendly={mobileFriendly} hasSider={!isMobile} {...props}>
        <MobileTopNavbar breadcrumbs={breadcrumbs} />
        {children}
      </StyledLayout>
    </>
  )
}

export default Page
