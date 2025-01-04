'use client'

import {
  Combobox as HeadlessCombobox,
  ComboboxButton as HeadlessComboboxButton,
  ComboboxInput as HeadlessComboboxInput,
  ComboboxProps as HeadlessComboboxProps,
} from '@headlessui/react'
import { ChevronUpDownIcon } from '@heroicons/react/20/solid'

import { Button } from '../Button'
import { Input, InputGroup } from '../Input'

interface Props<T> extends Omit<HeadlessComboboxProps<T, boolean | undefined>, 'className'> {
  children: React.ReactNode
  displayValue?: (value: T) => string
  onSearchBlur?: () => void
  onSearchChange?: (value: any) => void
  placeholder?: string
}

const Combobox = <T,>({
  children,
  displayValue = (value) => JSON.stringify(value),
  onSearchBlur,
  onSearchChange,
  placeholder,
  ...props
}: Props<T>) => (
  <HeadlessCombobox as="div" {...props}>
    <InputGroup>
      <HeadlessComboboxInput
        as={Input}
        displayValue={displayValue}
        onBlur={onSearchBlur}
        onChange={(event) => onSearchChange?.(event.target.value as T)}
        placeholder={placeholder}
      />
      <HeadlessComboboxButton as={Button} data-slot="button" icon plain>
        <ChevronUpDownIcon aria-hidden="true" />
      </HeadlessComboboxButton>
    </InputGroup>

    {children}
  </HeadlessCombobox>
)

export default Combobox
