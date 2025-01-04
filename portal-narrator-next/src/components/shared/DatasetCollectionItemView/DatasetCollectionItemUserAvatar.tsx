import { find } from 'lodash'

import { Avatar } from '@/components/primitives/Avatar'
import { Tooltip } from '@/components/primitives/Tooltip'
import { useCompany } from '@/stores/companies'

type Props = {
  createdBy: string | null
}

const DatasetCollectionItemUserAvatar = ({ createdBy }: Props) => {
  const company = useCompany()
  const user = find(company.users, (user) => user.userId === createdBy)

  if (!user) return <Avatar color="transparent" data-slot="lg-lead-icon" size="md" src="static/mavis/icons/logo.svg" />

  const { avatarUrl, email, firstName, lastName } = user
  const src = avatarUrl || null
  const initials = firstName && lastName ? `${firstName.slice(0, 1)}${lastName.slice(0, 1)}` : email?.slice(0, 1)
  const color = src ? 'transparent' : 'indigo'

  return (
    <Tooltip showArrow tip={email}>
      <Avatar color={color} data-slot="lg-lead-icon" initials={initials} size="md" src={src} />
    </Tooltip>
  )
}

export default DatasetCollectionItemUserAvatar
