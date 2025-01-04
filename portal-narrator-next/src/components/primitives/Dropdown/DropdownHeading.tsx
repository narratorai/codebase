'use client'

import { MenuHeading as HeadlessMenuHeading, MenuHeadingProps as HeadlessMenuHeadingProps } from '@headlessui/react'

import { OptionHeading } from '../Options'

type Props = Omit<HeadlessMenuHeadingProps, 'as' | 'className'>

const DropdownHeading = (props: Props) => <HeadlessMenuHeading as={OptionHeading} {...props} />

export default DropdownHeading
