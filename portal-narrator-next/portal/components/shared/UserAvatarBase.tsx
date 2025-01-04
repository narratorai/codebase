import { Space, Tooltip } from 'antd-next'
import { Typography, UserIcon } from 'components/shared/jawns'
import { ICompany_User } from 'graph/generated'
import { endsWith, isEmpty } from 'lodash'
import { userDisplayName } from 'util/helpers'

interface Props {
  email?: string
  companyUser?: ICompany_User
  profilePicture?: string
  showName?: boolean
  showTooltip?: boolean
  size?: 'small' | 'large' | 'default' | number
}

export const UserAvatarBase = ({
  email,
  companyUser,
  profilePicture,
  showName = true,
  showTooltip = true,
  size,
}: Props) => {
  // we use createdBySuperAdmin as bool to show narrator icon instead of initials or unknown
  const createdBySuperAdmin = isEmpty(companyUser) || endsWith(email, '@narrator.ai')

  // hover text over icon either name, email, or user unknown
  const userIdentifier = userDisplayName(companyUser?.first_name, companyUser?.last_name, email)

  return (
    <Tooltip title={showTooltip ? userIdentifier : undefined}>
      <Space data-test="tooltip-target">
        <UserIcon
          userIdentifier={userIdentifier}
          isSuperAdmin={createdBySuperAdmin}
          profilePicture={profilePicture}
          size={size}
        />
        {showName && <Typography className="user-avatar-identifier-text">{userIdentifier}</Typography>}
      </Space>
    </Tooltip>
  )
}

export default UserAvatarBase
