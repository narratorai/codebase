'use client'

import {
  ComboboxOptions as HeadlessComboboxOptions,
  ComboboxOptionsProps as HeadlessComboboxOptionsProps,
} from '@headlessui/react'

import { Options } from '../Options'

interface Props extends Omit<HeadlessComboboxOptionsProps, 'as' | 'className'> {
  children?: React.ReactNode
}

const ComboboxOptions = ({ children: options, ...props }: Props) => (
  <HeadlessComboboxOptions {...props} as={Options}>
    {options}
  </HeadlessComboboxOptions>
)

export default ComboboxOptions
