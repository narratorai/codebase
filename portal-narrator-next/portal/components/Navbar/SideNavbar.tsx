import {
  AimOutlined,
  AlertOutlined,
  ApiOutlined,
  BellOutlined,
  CodeOutlined,
  LockOutlined,
  MessageOutlined,
  PieChartOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons'
import { Badge, Layout, Menu, Space } from 'antd-next'
import { SiderProps } from 'antd-next/es/layout'
import { useAuth0 } from 'components/context/auth/hooks'
import { useCompany, useOnboardingSubscribedCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import ManageIcons from 'components/Manage/Company/ManageIcons'
import CompanySwitchModal from 'components/Navbar/CompanySwitchModal'
import { RECENTLY_VIEWED } from 'components/shared/IndexPages/constants'
import { Box, Flex, Link, Typography } from 'components/shared/jawns'
import { useLayoutContext } from 'components/shared/layout/LayoutProvider'
import {
  ICompany,
  ICompany_Status_Enum,
  useActivityMaintenanceCountSubscription,
  useDimTableMaintenanceCountSubscription,
  useGetCompaniesQuery,
  useTransformationMaintenanceCountSubscription,
} from 'graph/generated'
import { useFlags } from 'launchdarkly-react-client-sdk'
import { filter, isEmpty, sortBy } from 'lodash'
import NextLink from 'next/link'
import React, { useEffect, useState } from 'react'
import { Link as ReactRouterLink, useLocation } from 'react-router-dom'
import LogoSVG from 'static/img/logo.svg'
import styled, { css } from 'styled-components'
import { openChat } from 'util/chat'
import { breakpoints, colors, SIDENAV_WIDTH_COLLAPSED } from 'util/constants'
import { DOCUMENTATION_URL } from 'util/urls'

import {
  ActivityIcon,
  ChatIcon,
  CustomerJourneyIcon,
  DatasetIcon,
  DocsIcon,
  NarrativeIcon,
  ProcessingIcon,
  TransformationIcon,
} from './NavIcons'
import ProfilePicture from './ProfilePicture'

const { Sider } = Layout

const StyledSider = styled(Sider).withConfig({
  shouldForwardProp: (prop: any) => !['demoMode'].includes(prop),
})<{ demoMode: boolean }>`
  position: sticky;
  top: 0;
  max-height: 100vh;
  overflow: hidden;

  .antd5-menu-item {
    color: white;

    a {
      text-decoration: none;
    }
  }

  /* don't show SideNav on mobile */
  @media only screen and (max-width: ${breakpoints.md}) {
    display: none;
  }

  ${({ demoMode }) =>
    demoMode &&
    css`
      &::before {
        display: block;
        content: 'DEMO';
        position: absolute;
        top: 750px;
        left: 90px;
        transform: rotate(-90deg);
        transform-origin: left;
        color: ${colors.blue600};
        opacity: 0.35;
        font-size: 20rem;
        font-weight: bold;
        line-height: 1;
        pointer-events: none;
        background: linear-gradient(
          to left,
          ${colors.blue600} 0%,
          ${colors.blue400} 5%,
          ${colors.blue400} 7%,
          ${colors.blue600} 10%,
          ${colors.blue600} 20%
        );
        background-size: 200% auto;
        background-position: 0% center;
        background-clip: text;
        -webkit-background-clip: text; /* stylelint-disable-line */
        -webkit-text-fill-color: transparent;
      }
    `}

  .company-name {
    transition: opacity 150ms ease-in;
    white-space: nowrap;
  }

  &.antd5-layout-sider-collapsed .company-name {
    opacity: 0;
  }
`

const StyledMenu = styled(Menu)`
  border-right: none;

  .antd5-menu-item {
    display: flex;
    align-items: center;
  }

  .antd5-menu-item .antd5-menu-item-icon {
    line-height: 0;
  }

  .user-menu .antd5-menu-title-content {
    margin-left: 0;
    color: white;
  }
`

const Logo = ({ isAuthenticated, path, name }: { isAuthenticated: boolean; path: string; name: string }) => (
  <Box p={2} data-public relative>
    <Flex alignItems="center">
      <Space size={8}>
        {isAuthenticated ? (
          <ReactRouterLink to={`/${path}`} style={{ display: 'block' }}>
            <LogoSVG width="32px" height="32px" style={{ display: 'block' }} />
          </ReactRouterLink>
        ) : (
          <LogoSVG width="32px" height="32px" />
        )}
        <Box className="company-name">
          <Typography color="gray100">{name}</Typography>
        </Box>
      </Space>
    </Flex>
  </Box>
)

// eslint-disable-next-line max-lines-per-function
const SideNavbar: React.FC<SiderProps> = (props) => {
  const { status: companyStatus } = useOnboardingSubscribedCompany()

  const { demoMode, collapsed, autoCollapsed, setCollapsed, setAutoCollapsed } = useLayoutContext()
  const [selectedMenuKeys, setSelectedMenuKeys] = useState<string[]>([])
  const [switchCompanyModalVisible, setSwitchCompanyModalVisible] = useState(false)

  const location = useLocation()
  const flags = useFlags()
  const showLLM = flags['llm-training']
  const showChat = flags['llm-chat']

  const company = useCompany()
  const { user, isCompanyAdmin } = useUser()
  const { isAuthenticated, logout } = useAuth0()

  const { data: companiesData } = useGetCompaniesQuery()
  const sortedCompanies = sortBy(companiesData?.companies, 'name')

  const toggleSwitchCompanyModal = (value: boolean) => setSwitchCompanyModalVisible(value)

  const handleCompanySwitch = (selectedCompany: Partial<ICompany>) => {
    window.location.pathname = `/${selectedCompany.slug}`
  }

  const { data: activityMaintenanceCountData } = useActivityMaintenanceCountSubscription({
    variables: {
      company_id: company.id,
    },
  })
  const { data: dimTableMaintenanceCountData } = useDimTableMaintenanceCountSubscription({
    variables: {
      company_id: company.id,
    },
  })

  const { data: transformationMaintenanceCountData } = useTransformationMaintenanceCountSubscription({
    variables: {
      company_id: company.id,
    },
  })

  const transformationMaintenanceCount =
    filter(transformationMaintenanceCountData?.transformation, (trans) => !isEmpty(trans.transformation_maintenances))
      .length || 0

  const activityMaintenanceCount =
    filter(activityMaintenanceCountData?.activity, (act) => !isEmpty(act.activity_maintenances)).length || 0

  const dimTableMaintenanceCount =
    filter(dimTableMaintenanceCountData?.dim_table, (dim) => !isEmpty(dim?.maintenances)).length || 0

  const activityAndDimMaintenanceCount = activityMaintenanceCount + dimTableMaintenanceCount

  // This is a bit of logic to auto-collapse the side nav
  // if the browser width is less than 1200. This happens
  // only once on initial page load or if user resizes window
  // and triggers a route change
  useEffect(() => {
    if (window.innerWidth < 1200 && !autoCollapsed && !collapsed) {
      setCollapsed(true)
      setAutoCollapsed(true)
    }
  }, [autoCollapsed, collapsed, setAutoCollapsed, setCollapsed])

  useEffect(() => {
    const pathWithoutCompany = '/' + location.pathname.slice(1).split('/').slice(1).join('/')

    const potentialPaths = [
      '/narratives',
      '/dashboards',
      '/datasets',
      '/customer_journey',
      '/activities',
      '/transformations',
      '/manage',
      '/manage/warehouse',
      '/manage/company',
      '/manage/users',
      '/manage/branding',
      '/manage/tasks',
      '/manage/dynamic',
      '/manage/support',
      '/manage/notifications',
      '/manage/connections',
      '/query_editor',
      '/explore_warehouse',
    ]

    if (showLLM) {
      potentialPaths.push('/llms/trainings')
      potentialPaths.push('/llms/requests')
    }

    if (showChat) {
      potentialPaths.push('/chat')
    }

    const selectedPaths = filter(potentialPaths, (path) => pathWithoutCompany.startsWith(path))

    setSelectedMenuKeys(selectedPaths)
  }, [location.pathname, showLLM, showChat])

  // When company is provisioning, don't show the sidebar!
  if (companyStatus === ICompany_Status_Enum.New) {
    return null
  }

  return (
    <>
      <StyledSider
        theme="dark"
        demoMode={demoMode}
        collapsedWidth={SIDENAV_WIDTH_COLLAPSED}
        collapsible
        collapsed={collapsed}
        defaultCollapsed
        onCollapse={(collapsedValue: boolean) => {
          setCollapsed(collapsedValue)
        }}
        {...props}
      >
        <Flex flexDirection="column" style={{ height: '100%' }}>
          <Logo isAuthenticated={isAuthenticated} path={company.slug} name={company.name || company.slug} />

          {/* Primary Menu Items */}
          <Box flexGrow={1} data-public>
            <StyledMenu
              theme="dark"
              mode="vertical"
              selectedKeys={selectedMenuKeys}
              items={[
                showChat
                  ? {
                      key: '/chat',
                      title: 'Mavis AI',
                      icon: <ChatIcon />,
                      label: <NextLink href={`/v2/${company.slug}/chats`}>Mavis AI</NextLink>,
                    }
                  : null,
                {
                  key: '/datasets',
                  title: 'Datasets',
                  icon: <DatasetIcon />,
                  label: (
                    <Link unstyled to={`/datasets/${RECENTLY_VIEWED}`} data-test="nav-datasets">
                      Datasets
                    </Link>
                  ),
                },

                {
                  key: '/narratives',
                  title: 'Analyses',
                  icon: <NarrativeIcon />,
                  label: (
                    <Link unstyled to="/narratives" data-test="nav-narratives">
                      Analyses
                    </Link>
                  ),
                },
                {
                  key: '/dashboards',
                  title: 'Dashboards',
                  icon: <PieChartOutlined />,
                  label: (
                    <Link unstyled to="/dashboards" data-test="nav-dashboards">
                      Dashboards
                    </Link>
                  ),
                },
                {
                  key: '/activities',
                  title: 'Activities',
                  icon:
                    activityAndDimMaintenanceCount > 0 && collapsed ? (
                      <Badge
                        count={activityAndDimMaintenanceCount}
                        size="small"
                        offset={[12, 10]}
                        overflowCount={99}
                        style={{ paddingLeft: '4px', paddingRight: '4px' }}
                      >
                        <ActivityIcon />
                      </Badge>
                    ) : (
                      <ActivityIcon />
                    ),
                  label: (
                    <Link unstyled to="/activities" data-test="nav-activities">
                      Activities{' '}
                      {activityAndDimMaintenanceCount > 0 && (
                        <span style={{ color: colors.red400, marginLeft: '4px' }}>
                          ({activityAndDimMaintenanceCount})
                        </span>
                      )}
                    </Link>
                  ),
                },

                isCompanyAdmin
                  ? {
                      key: '/transformations',
                      title: 'Transformations',
                      icon:
                        transformationMaintenanceCount > 0 && collapsed ? (
                          <Badge
                            count={transformationMaintenanceCount}
                            size="small"
                            offset={[12, 10]}
                            overflowCount={99}
                            style={{ paddingLeft: '4px', paddingRight: '4px' }}
                          >
                            <TransformationIcon />
                          </Badge>
                        ) : (
                          <TransformationIcon />
                        ),
                      label: (
                        <Link unstyled to="/transformations" data-test="nav-transformations">
                          Transformations
                          {transformationMaintenanceCount > 0 && (
                            <span style={{ color: colors.red400, marginLeft: '4px' }}>
                              ({transformationMaintenanceCount})
                            </span>
                          )}
                        </Link>
                      ),
                    }
                  : null,
                showLLM
                  ? {
                      key: '/llms/trainings',
                      title: 'Trainings',
                      icon: <AimOutlined />,
                      label: (
                        <Link unstyled to="/llms/trainings" data-test="nav-trainings">
                          Trainings
                        </Link>
                      ),
                    }
                  : null,
                showLLM && isCompanyAdmin
                  ? {
                      key: '/llms/requests',
                      title: 'Requests',
                      icon: <AlertOutlined />,
                      label: (
                        <Link unstyled to="/llms/requests" data-test="nav-requests">
                          Requests
                        </Link>
                      ),
                    }
                  : null,
              ]}
            />
          </Box>

          {/* Secondary Menu Items */}
          <Box mb={2}>
            <StyledMenu
              theme="dark"
              mode="vertical"
              selectedKeys={selectedMenuKeys}
              items={[
                {
                  key: '/manage/tasks',
                  title: 'Processing',
                  icon: <ProcessingIcon data-public />,
                  label: (
                    <Link unstyled to="/manage/tasks" data-test="nav-processing">
                      Processing
                    </Link>
                  ),
                },

                {
                  key: '/customer_journey',
                  title: 'Customer Journey',
                  icon: <CustomerJourneyIcon data-public />,
                  label: (
                    <Link unstyled to="/customer_journey" data-test="nav-customers">
                      Customers
                    </Link>
                  ),
                },

                isCompanyAdmin
                  ? {
                      key: '/query_editor',
                      title: 'SQL Editor',
                      icon: <CodeOutlined data-public />,
                      label: (
                        <Link unstyled to="/query_editor" data-test="nav-sql">
                          SQL
                        </Link>
                      ),
                    }
                  : null,

                isCompanyAdmin
                  ? {
                      key: '/manage/dynamic',
                      title: 'Prototypes',
                      icon: <LockOutlined data-public data-test="nav-prototypes" />,
                      label: (
                        <Link unstyled to="/manage/dynamic">
                          Prototypes
                        </Link>
                      ),
                    }
                  : null,

                {
                  key: 'docs',
                  title: 'Docs',
                  icon: <DocsIcon data-public />,
                  className: 'docs-menu-item',
                  label: (
                    <a rel="noopener noreferrer" target="_blank" href={DOCUMENTATION_URL} data-test="nav-docs">
                      Docs
                    </a>
                  ),
                },

                {
                  key: 'open-support-ticket',
                  title: 'Chat with us',
                  icon: <MessageOutlined data-public data-test="nav-chat" />,
                  label: 'Chat with us',
                  onClick: () => openChat(),
                },

                isAuthenticated
                  ? {
                      key: 'authenticated-sub-menu',
                      label: user.email,
                      className: 'user-menu',
                      icon: (
                        <ProfilePicture
                          className="anticon"
                          style={{ display: 'inline-block', marginLeft: '-4px', marginRight: '0.5rem' }}
                          data-test="nav-profile-submenu"
                        />
                      ),
                      children: [
                        {
                          key: '/manage/warehouse',
                          icon: <ManageIcons type="warehouse" data-public />,
                          className: 'sidenav-sub-menu-item',
                          label: (
                            <Link unstyled to="/manage/warehouse" data-test="nav-manage-warehouse">
                              Warehouse Settings
                            </Link>
                          ),
                        },
                        {
                          key: '/manage/company',
                          icon: <ManageIcons type="company" data-public />,
                          className: 'sidenav-sub-menu-item',
                          label: (
                            <Link unstyled to="/manage/company" data-test="nav-manage-company">
                              Company Settings
                            </Link>
                          ),
                        },
                        {
                          key: '/manage/users',
                          icon: <ManageIcons type="users" data-public />,
                          className: 'sidenav-sub-menu-item',
                          label: (
                            <Link unstyled to="/manage/users" data-test="nav-manage-user">
                              User Access
                            </Link>
                          ),
                        },
                        {
                          key: '/manage/api-keys',
                          icon: <ApiOutlined data-public />,
                          className: 'sidenav-sub-menu-item',
                          label: (
                            <Link unstyled to="/manage/api-keys" data-test="nav-manage-api-keys">
                              API Keys
                            </Link>
                          ),
                        },
                        {
                          key: '/manage/billing',
                          icon: <ManageIcons type="billing" data-public />,
                          className: 'sidenav-sub-menu-item',
                          label: (
                            <Link unstyled to="/manage/billing" data-test="nav-manage-billing">
                              Billing
                            </Link>
                          ),
                        },
                        {
                          key: '/manage/branding',
                          icon: <ManageIcons type="branding" data-public />,
                          className: 'sidenav-sub-menu-item',
                          label: (
                            <Link unstyled to="/manage/branding" data-test="nav-manage-branding">
                              Branding
                            </Link>
                          ),
                        },

                        flags['manage-connections']
                          ? {
                              key: '/manage/connections',
                              icon: <ManageIcons type="connections" data-public />,
                              className: 'sidenav-sub-menu-item',
                              label: (
                                <Link unstyled to="/manage/connections" data-test="nav-manage-connections">
                                  Connections
                                </Link>
                              ),
                            }
                          : null,

                        { type: 'divider' },

                        {
                          key: '/manage/notifications',
                          icon: <BellOutlined data-public />,
                          className: 'sidenav-sub-menu-item',
                          label: (
                            <Link unstyled to="/manage/notifications" data-test="nav-manage-notifications">
                              Manage Notifications
                            </Link>
                          ),
                        },

                        // If there are more than 10 companies to choose from we will toggle a modal.
                        sortedCompanies.length > 1 && sortedCompanies.length > 10
                          ? {
                              key: 'switch-company',
                              icon: <UserSwitchOutlined data-public data-test="nav-switch-company" />,
                              className: 'sidenav-sub-menu-item',
                              onClick: () => toggleSwitchCompanyModal(true),
                              label: 'Switch Company',
                            }
                          : null,

                        // If there are 10 or less companies, let's just show them in a regular submenu
                        sortedCompanies.length > 1 && sortedCompanies.length <= 10
                          ? {
                              key: 'select-company',
                              label: 'Switch Company',
                              icon: <UserSwitchOutlined />,
                              className: 'sidenav-sub-menu-item',
                              children: sortedCompanies.map((comp) => ({
                                key: comp.slug,
                                onClick: () => handleCompanySwitch(comp),
                                style: { cursor: 'pointer' },
                                label: (
                                  <span data-test={`menu-switch-company-${comp.slug}`}>{comp.name || comp.slug}</span>
                                ),
                              })),
                            }
                          : null,

                        { type: 'divider' },

                        {
                          key: 'logout',
                          label: (
                            <span data-public data-test="nav-logout">
                              Log Out
                            </span>
                          ),
                          className: 'sidenav-sub-menu-item',
                          onClick: () => logout(),
                        },
                      ],
                    }
                  : null,
              ]}
            />
          </Box>
        </Flex>
      </StyledSider>

      {/* NOTE: If there are a lot of companies to
          choose from, we use this modal vs the inline menu.
          See logic above where "Switch Company" is ^^
      */}
      {switchCompanyModalVisible && (
        <CompanySwitchModal
          handleCompanySwitch={handleCompanySwitch}
          toggleSwitchCompanyModal={toggleSwitchCompanyModal}
        />
      )}
    </>
  )
}

export default SideNavbar
