import { Flex, Typography } from 'antd-next'
import { useUser } from 'components/context/user/hooks'
import UserAvatar from 'components/shared/UserAvatar'
import { IUser } from 'graph/generated'
import { isEmpty, join } from 'lodash'
import Image from 'next/image'
import MavisAiIcon from 'static/img/MavisAiIcon.png'
import styled from 'styled-components'
import { colors } from 'util/constants'

const StyledText = styled(Typography)`
  color: ${colors.mavis_dark_gray};
  margin-left: 8px;
  font-weight: 500;
`

interface Props {
  user?: IUser
  isUser?: boolean
}

const AvatarAndTitle = ({ user, isUser = false }: Props) => {
  const { user: currentUser } = useUser()
  const userForAvatar = user || currentUser

  const companyUser = userForAvatar.company_users?.[0]
  const showEmail = isEmpty(companyUser?.first_name) || isEmpty(companyUser?.last_name)
  const companyUserTitle = showEmail ? userForAvatar.email : join([companyUser?.first_name, companyUser?.last_name])

  const currentUserCreatedChat = currentUser.id === user?.id
  const userTitle = currentUserCreatedChat ? 'You' : companyUserTitle
  const title = isUser ? userTitle : 'Mavis AI'

  return (
    <Flex align="center" style={{ padding: '16px 0px' }}>
      {isUser ? (
        <UserAvatar user={userForAvatar as IUser} showName={false} showTooltip={false} />
      ) : (
        <Image alt="Mavis AI Icon" src={MavisAiIcon} width={30} height={30} />
      )}

      <StyledText>{title}</StyledText>
    </Flex>
  )
}

export default AvatarAndTitle
