'use client'

import {
  ComboboxOption as HeadlessComboboxOption,
  ComboboxOptionProps as HeadlessComboboxOptionProps,
} from '@headlessui/react'

import { Option } from '../Options'

interface Props<T> extends Omit<HeadlessComboboxOptionProps<'div', T>, 'as' | 'className'> {
  children?: React.ReactNode
}

const ComboboxOption = <T,>({ children, ...props }: Props<T>) => (
  <HeadlessComboboxOption {...props} as={Option}>
    {children}
  </HeadlessComboboxOption>
)

export default ComboboxOption
