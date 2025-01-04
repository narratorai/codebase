'use client'

import { MenuSection as HeadlessMenuSection, MenuSectionProps as HeadlessMenuSectionProps } from '@headlessui/react'

import { OptionSection } from '../Options'

type Props = Omit<HeadlessMenuSectionProps, 'as' | 'className'>

const DropdownSection = (props: Props) => <HeadlessMenuSection as={OptionSection} {...props} />

export default DropdownSection
