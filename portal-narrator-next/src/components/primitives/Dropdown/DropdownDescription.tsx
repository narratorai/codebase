'use client'

import { Description as HeadlessDescription, DescriptionProps as HeadlessDescriptionProps } from '@headlessui/react'

import { OptionDescription } from '../Options'

type Props = Omit<HeadlessDescriptionProps, 'as' | 'className'>

const DropdownDescription = (props: Props) => (
  <HeadlessDescription as={OptionDescription} data-slot="description" {...props} />
)

export default DropdownDescription
