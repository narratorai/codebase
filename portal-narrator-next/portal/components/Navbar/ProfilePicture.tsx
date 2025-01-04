import { Avatar } from 'antd-next'
import { useAuth0 } from 'components/context/auth/hooks'
import { Box, BoxProps, Typography } from 'components/shared/jawns'
import _ from 'lodash'
import { colors, semiBoldWeight } from 'util/constants'
import { initialsFromString } from 'util/helpers'

const DEFAULT_AVATAR_SIZE = 24

interface Props extends BoxProps {
  avatarSize?: number
}

const ProfilePicture = ({ avatarSize, ...props }: Props) => {
  const { user } = useAuth0()
  if (!user) {
    return null
  }

  return (
    <Box {...props} data-private>
      {user.picture ? (
        <Avatar size={avatarSize || DEFAULT_AVATAR_SIZE} src={user.picture} />
      ) : (
        <Avatar
          size={avatarSize || DEFAULT_AVATAR_SIZE}
          style={{
            backgroundColor: colors.blue200,
            color: colors.blue500,
            verticalAlign: 'middle',
          }}
        >
          {user.name ? (
            <Typography as="span" fontWeight={semiBoldWeight}>
              {_.toUpper(initialsFromString(user.name))}
            </Typography>
          ) : null}
        </Avatar>
      )}
    </Box>
  )
}

export default ProfilePicture
