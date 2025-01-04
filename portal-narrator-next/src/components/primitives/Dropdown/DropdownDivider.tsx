'use client'

import {
  MenuSeparator as HeadlessMenuSeparator,
  MenuSeparatorProps as HeadlessMenuSeparatorProps,
} from '@headlessui/react'

import { OptionSeparator } from '../Options'

type Props = Omit<HeadlessMenuSeparatorProps, 'as' | 'className'>

const DropdownDivider = (props: Props) => <HeadlessMenuSeparator as={OptionSeparator} {...props} />

export default DropdownDivider
