'use client'

import { Label as HeadlessLabel, LabelProps as HeadlessLabelProps } from '@headlessui/react'

import { OptionLabel } from '../Options'

type Props = Omit<HeadlessLabelProps<'p'>, 'as' | 'className'>

const DropdownLabel = (props: Props) => <HeadlessLabel as={OptionLabel} data-slot="label" {...props} />

export default DropdownLabel
