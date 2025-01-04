'use client'

import {
  ListboxOption as HeadlessListboxOption,
  ListboxOptionProps as HeadlessListboxOptionProps,
} from '@headlessui/react'
import React from 'react'

import { Option } from '../Options'

type Props<T> = {
  children?: React.ReactNode
} & Omit<HeadlessListboxOptionProps<'div', T>, 'as' | 'className'>

const ListboxOption = <T,>({ children, ...props }: Props<T>) => (
  <HeadlessListboxOption {...props} as={Option}>
    {children}
  </HeadlessListboxOption>
)

export default ListboxOption
