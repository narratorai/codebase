import {
  ClockCircleOutlined,
  LockOutlined,
  RiseOutlined,
  SnippetsOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { ItemType } from 'antd/lib/menu/hooks/useItems'
import { Badge, Menu, Tooltip } from 'antd-next'
import { useUser } from 'components/context/user/hooks'
import AddSharedTagPopover from 'components/shared/IndexPages/AddSharedTagPopover'
import { Box } from 'components/shared/jawns'
import { Flex, Typography } from 'components/shared/jawns'
import { FixedSider } from 'components/shared/layout/LayoutWithFixedSider'
import _ from 'lodash'
import React from 'react'
import styled from 'styled-components'
import { colors } from 'util/constants'

import {
  ALL_MINE,
  ALL_SHARED,
  DRAFTS,
  EVERYTHING,
  FAVORITES,
  INDEX_SIDEBAR_WIDTH,
  POPULAR,
  RECENTLY_VIEWED,
  SUPER_ADMIN_ALL_DRAFTS,
} from './constants'
import { ITag } from './interfaces'

const StyledMenu = styled(Menu)`
  border-right: none;
  overflow: hidden auto;
  padding-bottom: 16px;

  .antd5-menu {
    background: white;
  }

  .antd5-menu-item {
    background-color: white;
  }

  .anticon {
    font-size: 14px;
  }

  /* move the dropdown arrow to the left side instead of the right */
  .antd5-menu-submenu-arrow {
    left: 2px;
    color: ${colors.gray400};

    /* the arrow faces down when closed so make it face right */
    transform: translateY(-2px) rotate(270deg);
  }

  /* point the arrow down when open instead of up  */
  .antd5-menu-submenu-open .antd5-menu-submenu-arrow {
    transform: translateX(-2px) translateY(4px) rotate(180deg) !important;
  }

  .antd5-menu-submenu-inline,
  .antd5-menu-item {
    padding-left: 16px;
    background: white;
  }

  .antd5-menu-item,
  .antd5-menu-sub.ant-menu-inline > .antd5-menu-item {
    height: 32px;
    line-height: 32px;
    margin-bottom: 0;
    padding-inline: 0;
  }

  .antd5-menu-item-only-child {
    padding-left: 24px !important;
  }

  .closable-menu-item {
    padding-left: 0 !important;
  }

  /* remove blue border on selected items */
  .antd5-menu-item-selected::after {
    border-right: none;
  }

  .antd5-menu-submenu {
    margin-top: 24px;
  }

  .antd5-menu-sub {
    background: white !important;
  }

  .antd5-menu-submenu-selected {
    color: inherit;
  }

  .antd5-menu-item-divider {
    margin-top: 16px;
  }

  .antd5-badge {
    max-width: 100%;
  }

  li.antd5-menu-item-selected .antd5-badge-status-text,
  li.antd5-menu-item-active .antd5-badge-status-text {
    color: ${colors.blue500};
  }
`

// make badge a square to give it visual separation
// from AssembledBadge (see narratives/dashboards)
const StyledBadgeContainer = styled.div`
  .antd5-badge-status-dot {
    border-radius: 0 !important;
  }
`

interface IndexSidebarProps {
  title?: string
  tags?: ITag[]
  activeMenuItem: string
  onClick: (id: string) => void
  extra?: ItemType | ItemType[]
}

const IndexSidebar: React.FC<IndexSidebarProps> = ({ title, tags, activeMenuItem, onClick, extra }) => {
  const { isCompanyAdmin, isSuperAdmin } = useUser()

  const extraMenuItems: ItemType[] = !extra ? [] : [{ type: 'divider' }, ...(Array.isArray(extra) ? extra : [extra])]

  return (
    <FixedSider
      width={INDEX_SIDEBAR_WIDTH}
      style={{ background: 'white', borderRight: `1px solid ${colors.gray300}` }}
      data-test="shared-index-sidebar"
    >
      {title && (
        <Typography type="title300" p={2}>
          {title}
        </Typography>
      )}

      <StyledMenu
        theme="light"
        mode="inline"
        onClick={(e) => {
          // HACKY: e?.key check is b/c <AddSharedTagPopover />
          // is nested inside the menu ... clicking on it fires these menu events
          // but we don't want to navigate anywhere - so ignore
          // (AddSharedTagPopover clicks don't have event keys)
          if (e?.key && onClick && e.key !== 'add-tag') {
            onClick(e.key.toString())
          }
        }}
        selectedKeys={[activeMenuItem]}
        defaultOpenKeys={['mine', 'shared', 'open']}
        items={[
          {
            key: RECENTLY_VIEWED,
            icon: <ClockCircleOutlined />,
            label: 'Recently Viewed',
          },
          {
            key: POPULAR,
            icon: <RiseOutlined />,
            label: 'Popular',
          },
          {
            key: EVERYTHING,
            icon: <SnippetsOutlined />,
            label: 'Everything',
          },

          {
            key: 'mine',
            label: 'Mine',
            icon: <UserOutlined />,
            children: [
              {
                key: ALL_MINE,
                label: <span data-test="index-sidebar-all-mine">All</span>,
              },
              {
                key: FAVORITES,
                label: <span data-test="index-sidebar-favorites">Favorites</span>,
              },
              {
                key: DRAFTS,
                label: <span data-test="index-sidebar-drafts">Private</span>,
              },
              isSuperAdmin
                ? {
                    key: SUPER_ADMIN_ALL_DRAFTS,
                    style: { color: colors.red500 },
                    label: (
                      <Tooltip title="Super Admin Only" placement="right">
                        <Flex alignItems="center">
                          <span style={{ marginRight: '8px' }}>Private (everyone)</span>
                          <LockOutlined />
                        </Flex>
                      </Tooltip>
                    ),
                  }
                : null,
            ],
          },

          tags
            ? {
                key: 'shared',
                style: { zIndex: 10 },
                label: 'Shared',
                icon: <TeamOutlined />,
                children: [
                  {
                    key: ALL_SHARED,
                    label: (
                      <StyledBadgeContainer>
                        <Badge color={'transparent'} text={'All'} data-test="index-sidebar-all-shared" />
                      </StyledBadgeContainer>
                    ),
                  },
                  ...tags.map((tag) => ({
                    key: tag.id,
                    label: (
                      <Tooltip title={tag.tag?.length > 24 ? tag.tag : undefined} placement="right">
                        <StyledBadgeContainer>
                          <Badge color={tag.color || 'transparent'} text={_.truncate(tag.tag, { length: 24 })} />
                        </StyledBadgeContainer>
                      </Tooltip>
                    ),
                  })),
                ],
              }
            : null,

          isCompanyAdmin
            ? {
                key: 'add-tag',
                label: (
                  <Box ml={2} mt={1}>
                    <AddSharedTagPopover />
                  </Box>
                ),
              }
            : null,

          ...extraMenuItems,
        ]}
      />
    </FixedSider>
  )
}

export default IndexSidebar
