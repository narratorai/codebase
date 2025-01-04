'use client'

import { MenuButton as HeadlessMenuButton, MenuButtonProps as HeadlessMenuButtonProps } from '@headlessui/react'

import { Button } from '../Button'

type Props<T extends React.ElementType = typeof Button> = Omit<HeadlessMenuButtonProps<T>, 'className'>

const DropdownButton = <T extends React.ElementType = typeof Button>({ as = Button, ...props }: Props<T>) => (
  <HeadlessMenuButton as={as} {...props} />
)

export default DropdownButton
