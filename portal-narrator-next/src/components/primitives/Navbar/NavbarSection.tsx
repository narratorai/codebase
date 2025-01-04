'use client'

import { LayoutGroup } from 'framer-motion'
import { useId } from 'react'

type Props = React.ComponentPropsWithoutRef<'div'>

const NavbarSection = (props: Props) => {
  const id = useId()

  return (
    <LayoutGroup id={id}>
      <div className="flex items-center gap-3" {...props} />
    </LayoutGroup>
  )
}

export default NavbarSection
