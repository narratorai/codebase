import { CheckIcon } from '@heroicons/react/24/outline'
import React from 'react'

import { OptionContents } from '../Options'

type Props = {
  children?: React.ReactNode
} & Omit<React.ComponentPropsWithoutRef<'div'>, 'className'>

const ListboxOptionContents = ({ children, ...props }: Props) => (
  <OptionContents {...props}>
    {children}
    <CheckIcon data-slot="selection" />
  </OptionContents>
)

export default ListboxOptionContents
