import {
  BlockOutlined,
  DeleteOutlined,
  EditOutlined,
  HeartOutlined,
  HeartTwoTone,
  LockOutlined,
  MoreOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { Dropdown } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { Box } from 'components/shared/jawns'
import { compact } from 'lodash'
import { useContext, useRef } from 'react'
import { useHistory } from 'react-router-dom'
import { colors, PINK_HEART_COLOR } from 'util/constants'
import useFavoriteNarrative from 'util/narratives/useFavoriteNarrative'

import DashboardIndexContent from './DashboardIndexContext'
import { DashboardType } from './interfaces'

interface Props {
  dashboard: DashboardType
}

const DashboardMenu = ({ dashboard }: Props) => {
  const history = useHistory()
  const company = useCompany()
  const { user, isCompanyAdmin, isSuperAdmin } = useUser()
  const {
    handleOpenConfigOverlay,
    handleOpenDeleteOverlay,
    handleOpenDuplicateOverlay,
    handleOpenUpdateOverlay,
    setRefreshIndex,
  } = useContext(DashboardIndexContent)

  const handleFavoriteToggleSuccess = () => {
    setRefreshIndex(true)
  }

  const [toggleFavorite, { isFavorited }] = useFavoriteNarrative({
    narrative: dashboard,
    onToggleSuccess: handleFavoriteToggleSuccess,
  })

  const notAllowedToUpdate = user.id !== dashboard?.created_by && !isCompanyAdmin
  const dropdownTargetRef = useRef<HTMLDivElement>(null)

  const goToEditDashboard = () => history.push(`/${company.slug}/dashboards/edit/${dashboard.slug}`)
  const menuItems = compact([
    {
      key: 'edit-dashboard',
      onClick: goToEditDashboard,
      disabled: notAllowedToUpdate,
      icon: <EditOutlined />,
      label: 'Edit Dashboard',
    },

    {
      key: 'update',
      onClick: () => {
        handleOpenUpdateOverlay(dashboard)
      },
      disabled: notAllowedToUpdate,
      icon: <SettingOutlined />,
      label: 'Edit Properties',
    },

    dashboard.state !== 'archived'
      ? {
          key: 'delete',
          onClick: () => {
            handleOpenDeleteOverlay(dashboard)
          },
          disabled: notAllowedToUpdate,
          icon: <DeleteOutlined data-test="delete-dashboard-menu-item" />,
          label: 'Delete',
        }
      : null,

    {
      key: 'duplicate',
      onClick: () => {
        handleOpenDuplicateOverlay(dashboard)
      },
      icon: <BlockOutlined />,
      label: 'Duplicate',
    },
    {
      key: 'favorite',
      onClick: toggleFavorite,
      icon: isFavorited ? <HeartTwoTone twoToneColor={PINK_HEART_COLOR} /> : <HeartOutlined />,
      label: isFavorited ? 'Unfavorite' : 'Favorite',
    },

    isSuperAdmin ? { type: 'divider' } : null,
    isSuperAdmin
      ? {
          key: 'update-config',
          onClick: () => {
            handleOpenConfigOverlay(dashboard)
          },
          icon: <LockOutlined style={{ color: colors.red500 }} />,
          label: 'Update raw JSON Config',
        }
      : null,
  ])

  return (
    <Box data-test="dashboard-item-options">
      <div data-test="dashboard-item-dropdown" ref={dropdownTargetRef} />
      <Dropdown
        getPopupContainer={() => dropdownTargetRef.current as HTMLDivElement}
        menu={{
          // @ts-ignore: not accepting divider (thinks it's a submenu item)
          items: menuItems,
        }}
      >
        <MoreOutlined title="Options" />
      </Dropdown>
    </Box>
  )
}

export default DashboardMenu
