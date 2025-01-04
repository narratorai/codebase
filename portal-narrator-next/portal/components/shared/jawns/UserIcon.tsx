import { UserOutlined } from '@ant-design/icons'
import { AvatarProps } from 'antd/es/avatar'
import { Avatar } from 'antd-next'
import { Typography } from 'components/shared/jawns'
import { isEmpty, toUpper } from 'lodash'
import { colors, semiBoldWeight } from 'util/constants'
import { initialsFromString } from 'util/helpers'

interface Props extends AvatarProps {
  userIdentifier: string
  isSuperAdmin?: boolean
  profilePicture?: string
}

const UserIcon = ({ userIdentifier = '', isSuperAdmin = false, profilePicture, ...restProps }: Props) => {
  const userInitials = initialsFromString(userIdentifier)

  // if there is a profile picture, use it
  if (!isEmpty(profilePicture)) {
    return <Avatar src={profilePicture} {...restProps} />
  }

  if (!isEmpty(userInitials)) {
    return (
      <Avatar
        style={{
          backgroundColor: isSuperAdmin ? colors.red400 : colors.blue200,
          color: isSuperAdmin ? colors.blue800 : colors.blue500,
          verticalAlign: 'middle',
        }}
        {...restProps}
        data-private
      >
        <Typography as="span" fontWeight={semiBoldWeight} color="white">
          {toUpper(userInitials)}
        </Typography>
      </Avatar>
    )
  }

  return <Avatar icon={<UserOutlined />} />
}

export default UserIcon
