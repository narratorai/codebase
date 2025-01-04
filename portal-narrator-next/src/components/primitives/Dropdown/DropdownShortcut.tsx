'use client'

import { Description as HeadlessDescription, DescriptionProps as HeadlessDescriptionProps } from '@headlessui/react'

import { OptionShortcut } from '../Options'

type Props = { keys: string | string[] } & Omit<HeadlessDescriptionProps<'kbd'>, 'as' | 'className'>

const DropdownShortcut = (props: Props) => <HeadlessDescription as={OptionShortcut} {...props} />

export default DropdownShortcut
