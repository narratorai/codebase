'use client'

import {
  Listbox as HeadlessListbox,
  ListboxButton as HeadlessListboxButton,
  ListboxOptions as HeadlessListboxOptions,
  ListboxOptionsProps as HeadlessListboxOptionsProps,
  ListboxProps as HeadlessListboxProps,
} from '@headlessui/react'
import { Fragment } from 'react'

import { SingleSelectButton } from '../Button'
import { Options } from '../Options'

type Anchor = Pick<HeadlessListboxOptionsProps, 'anchor'>

type Props<T> = {
  placeholder?: React.ReactNode
  autoFocus?: boolean
  'aria-label'?: string
  children?: React.ReactNode
  displayValue?: (value: T) => string
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void
} & Anchor &
  Omit<HeadlessListboxProps<typeof Fragment, T>, 'as' | 'multiple'>

const Listbox = <T,>({
  anchor = { gap: '8px', to: 'bottom start' },
  'aria-label': ariaLabel,
  autoFocus,
  children: options,
  displayValue = (value: T) => JSON.stringify(value),
  onScroll,
  placeholder,
  ...props
}: Props<T>) => (
  <HeadlessListbox {...props} multiple={false}>
    <HeadlessListboxButton aria-label={ariaLabel} as={Fragment} autoFocus={autoFocus} data-slot="control">
      {({ value }) => (
        <SingleSelectButton<T> displayValue={displayValue} outline placeholder={placeholder} value={value} />
      )}
    </HeadlessListboxButton>

    <HeadlessListboxOptions anchor={anchor} as={Options} onScroll={onScroll} transition>
      {options}
    </HeadlessListboxOptions>
  </HeadlessListbox>
)

export default Listbox
