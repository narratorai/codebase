'use client'

import { MenuItem as HeadlessMenuItem } from '@headlessui/react'

import { Link } from '../Link'
import { ButtonOption, LinkOption, OptionContents } from '../Options'

type Props =
  | Omit<React.ComponentPropsWithoutRef<'button'>, 'as' | 'className'>
  | Omit<React.ComponentPropsWithoutRef<typeof Link>, 'className'>

const DropdownItem = ({ children, ...props }: Props) => (
  <HeadlessMenuItem>
    {'href' in props ? (
      <LinkOption {...props}>
        <OptionContents>{children}</OptionContents>
      </LinkOption>
    ) : (
      <ButtonOption {...props}>
        <OptionContents>{children}</OptionContents>
      </ButtonOption>
    )}
  </HeadlessMenuItem>
)

export default DropdownItem
