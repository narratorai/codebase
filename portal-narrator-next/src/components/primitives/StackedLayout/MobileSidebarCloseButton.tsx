import { CloseButton as HeadlessCloseButton } from '@headlessui/react'

import CloseMenuIcon from './CloseMenuIcon'

interface Props {
  as: React.ElementType
}

const MobileSidebarCloseButton = ({ as }: Props) => {
  return (
    <HeadlessCloseButton aria-label="Close navigation" as={as}>
      <CloseMenuIcon />
    </HeadlessCloseButton>
  )
}

export default MobileSidebarCloseButton
