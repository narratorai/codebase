import { useCompany } from 'components/context/company/hooks'
import { ICompany_User, IUser, useListCompanysCompanyUsersPreferencesQuery } from 'graph/generated'
import { compact, find, get, map } from 'lodash'

import UserAvatarBase from './UserAvatarBase'

interface Props {
  user?: IUser
  companyUser?: ICompany_User
  showName?: boolean
  showTooltip?: boolean
  size?: 'small' | 'large' | 'default' | number
}

const UserAvatar = ({ user, companyUser, showName, showTooltip, size = 'default' }: Props) => {
  const company = useCompany()

  if (!companyUser) {
    companyUser = user?.company_users.find((compUser) => compUser.company.id === company.id)
  }

  const { data: preferenceData } = useListCompanysCompanyUsersPreferencesQuery({
    variables: { company_id: company.id },
  })
  const preferences = compact(map(preferenceData?.company_user, (comp_user) => comp_user.preferences))

  const profilePicture = get(find(preferences, ['company_user_id', companyUser?.id]), 'profile_picture') as
    | string
    | undefined

  return (
    <UserAvatarBase
      email={user?.email}
      companyUser={companyUser}
      profilePicture={profilePicture}
      showName={showName}
      showTooltip={showTooltip}
      size={size}
    />
  )
}

export default UserAvatar
