import { UserSwitchOutlined } from '@ant-design/icons'
import { Layout, Menu } from 'antd-next'
import { useAuth0 } from 'components/context/auth/hooks'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { Flex, Link, Typography } from 'components/shared/jawns'
import { ICompany, useGetCompaniesQuery } from 'graph/generated'
import _ from 'lodash'
import { useEffect, useState } from 'react'
import Headroom from 'react-headroom'
import { useLocation } from 'react-router'
import LogoSVG from 'static/img/logo.svg'
import styled from 'styled-components'
import { breakpoints, MOBILE_TOPNAV_HEIGHT, zIndex } from 'util/constants'

import MobileBreadcrumbs, { MobileBreadcrumb } from './MobileBreadcrumbs'
import { NarrativeIcon } from './NavIcons'
import ProfilePicture from './ProfilePicture'

const { Header } = Layout

interface Props {
  breadcrumbs?: MobileBreadcrumb[]
}

const StyledHeader = styled(Header)`
  position: relative;
  overflow: hidden;
  width: 100%;
  height: ${MOBILE_TOPNAV_HEIGHT}px;
  padding: 0;
  z-index: ${zIndex.overlay + 1};

  .antd5-menu-item {
    margin-right: 0;
  }

  @media only screen and (min-width: ${breakpoints.md}) {
    display: none;
  }
`

const StyledMenu = styled(Menu)`
  width: 100%;
  height: 100%;

  .antd5-menu-overflow-item {
    background: inherit !important;
  }
`

const MobileTopNavbar = ({ breadcrumbs = [] }: Props) => {
  const { isAuthenticated, logout } = useAuth0()
  const location = useLocation()
  const company = useCompany()
  const { user } = useUser()

  const [selectedMenuKeys, setSelectedMenuKeys] = useState<string[]>([])

  const { data: companiesData } = useGetCompaniesQuery()
  const sortedCompanies = _.sortBy(companiesData?.companies, 'name')

  const handleCompanySwitch = (selectedCompany: Partial<ICompany>) => {
    window.location.pathname = `/${selectedCompany.slug}`
  }

  useEffect(() => {
    const selectedPaths = _.filter(['/narratives'], (path) => _.includes(location.pathname, path))

    setSelectedMenuKeys(selectedPaths)
  }, [location.pathname])

  return (
    <Headroom>
      <StyledHeader>
        <Flex style={{ position: 'absolute', top: 0, bottom: 0, left: '70px', right: '70px' }} justifyContent="center">
          <Flex flexDirection="column" justifyContent="center">
            <Typography type="title400" color="white" textAlign="center">
              {_.truncate(company?.name || company?.slug, { length: 17 })}
            </Typography>

            <MobileBreadcrumbs breadcrumbs={breadcrumbs} />
          </Flex>
        </Flex>

        <StyledMenu
          theme="dark"
          mode="horizontal"
          triggerSubMenuAction="click"
          selectedKeys={selectedMenuKeys}
          items={[
            {
              key: 'avatar-menu',
              icon: <LogoSVG width="32px" style={{ marginTop: '12px', fontSize: '18px' }} />,
              children: [
                company
                  ? {
                      key: '/narratives',
                      icon: <NarrativeIcon />,
                      label: (
                        <Link unstyled to="/narratives">
                          Narratives
                        </Link>
                      ),
                      title: 'Narratives',
                    }
                  : null,

                {
                  key: 'switch-company',
                  title: 'Switch Company',
                  label: 'Switch Company',
                  icon: <UserSwitchOutlined />,
                  children: sortedCompanies.map((comp) => ({
                    key: comp.slug,
                    label: comp.name || comp.slug,
                    onClick: () => handleCompanySwitch(comp),
                    style: { cursor: 'pointer' },
                  })),
                },

                isAuthenticated
                  ? {
                      key: 'authenticated-sub-menu',
                      label: _.truncate(user.email, {
                        length: 20,
                      }),
                      className: 'user-menu',
                      icon: (
                        <ProfilePicture className="anticon" style={{ display: 'inline-block', marginLeft: '-4px' }} />
                      ),
                      popupOffset: [0, 1],
                      children: [
                        {
                          key: 'logout',
                          label: <span data-public>Log Out</span>,
                          onClick: () => logout(),
                        },
                      ],
                    }
                  : null,
              ],
            },
          ]}
        />
      </StyledHeader>
    </Headroom>
  )
}

export default MobileTopNavbar
