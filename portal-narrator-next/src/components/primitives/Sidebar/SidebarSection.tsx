'use client'

import { LayoutGroup } from 'framer-motion'
import { useId } from 'react'

type Props = React.ComponentPropsWithoutRef<'div'>

const SidebarSection = (props: Props) => {
  const id = useId()

  return (
    <LayoutGroup id={id}>
      <div className="flex flex-col gap-0.5" data-slot="section" {...props} />
    </LayoutGroup>
  )
}

export default SidebarSection
