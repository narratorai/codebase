import { PlusIcon } from '@heroicons/react/24/solid'

import { NavbarItem } from '@/components/primitives/Navbar'
import { useCompanySlugParam } from '@/hooks'
import { useUser } from '@/stores/users'

const NewChatButton = () => {
  const companySlug = useCompanySlugParam()

  const accessRoles = useUser((state) => state.accessRoles)

  if (!accessRoles.CreateChat) return null

  return (
    <NavbarItem href={`/v2/${companySlug}/chats`}>
      <PlusIcon />
      New chat
    </NavbarItem>
  )
}

export default NewChatButton
