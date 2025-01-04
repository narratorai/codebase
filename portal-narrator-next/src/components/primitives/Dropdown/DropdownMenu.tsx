'use client'

import { MenuItems as HeadlessMenuItems, MenuItemsProps as HeadlessMenuItemsProps } from '@headlessui/react'

import { Options } from '../Options'

type Props = Omit<HeadlessMenuItemsProps, 'as' | 'className'>

const DropdownMenu = ({ anchor = 'bottom', ...props }: Props) => (
  <HeadlessMenuItems anchor={anchor} as={Options} transition {...props} />
)

export default DropdownMenu
