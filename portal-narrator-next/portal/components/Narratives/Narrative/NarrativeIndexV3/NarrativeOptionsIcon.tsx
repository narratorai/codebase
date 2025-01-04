import { BlockOutlined, DeleteOutlined, EditOutlined, LockOutlined, MoreOutlined } from '@ant-design/icons'
import { Dropdown } from 'antd-next'
import { useUser } from 'components/context/user/hooks'
import { Box } from 'components/shared/jawns'
import { compact } from 'lodash'
import React, { useContext, useRef } from 'react'
import { colors } from 'util/constants'

import { NarrativeType } from './interfaces'
import NarrativeIndexContext from './NarrativeIndexContext'

interface Props {
  narrative: NarrativeType
}

const NarrativeOptionsIcon = ({ narrative }: Props) => {
  const { user, isCompanyAdmin, isSuperAdmin } = useUser()
  const { handleOpenUpdateOverlay, handleOpenDeleteOverlay, handleOpenConfigOverlay, handleOpenDuplicateOverlay } =
    useContext(NarrativeIndexContext)

  const dropdownTargetRef = useRef<HTMLDivElement>(null)
  const notAllowedToUpdate = user.id !== narrative?.created_by && !isCompanyAdmin

  const menuItems = compact([
    {
      key: 'update',
      onClick: () => {
        handleOpenUpdateOverlay(narrative)
      },
      disabled: notAllowedToUpdate,
      icon: <EditOutlined />,
      label: 'Edit Properties',
    },

    narrative.state !== 'archived'
      ? {
          key: 'delete',
          onClick: () => {
            handleOpenDeleteOverlay(narrative)
          },
          disabled: notAllowedToUpdate,
          icon: <DeleteOutlined data-test="delete-narrative-menu-item" />,
          label: 'Delete',
        }
      : null,

    {
      key: 'duplicate',
      onClick: () => {
        handleOpenDuplicateOverlay(narrative)
      },
      icon: <BlockOutlined />,
      label: 'Duplicate',
    },

    isSuperAdmin ? { type: 'divider' } : null,
    isSuperAdmin
      ? {
          key: 'update-config',
          onClick: () => {
            handleOpenConfigOverlay(narrative)
          },
          icon: <LockOutlined style={{ color: colors.red500 }} />,
          label: 'Update raw JSON Config',
        }
      : null,
  ])

  return (
    <Box data-test="narrative-item-options">
      <div data-test="narrative-item-dropdown" ref={dropdownTargetRef} />

      <Dropdown
        menu={{
          // @ts-ignore: not accepting divider (thinks it's a submenu item)
          items: menuItems,
        }}
      >
        <MoreOutlined style={{ color: colors.blue500 }} title="Options" />
      </Dropdown>
    </Box>
  )
}

export default NarrativeOptionsIcon
