'use client'

import {
  Combobox,
  ComboboxInputProps,
  ComboboxProps,
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogProps,
} from '@headlessui/react'
import React from 'react'

import SearchboxInput from './SearchboxInput'

interface Props<T> extends Omit<ComboboxProps<T, boolean | undefined>, 'className'> {
  children: React.ReactNode
  searchboxDialogProps: Omit<DialogProps, 'className'>
  searchboxInputProps?: Omit<ComboboxInputProps, 'className'>
  searchboxProps?: Omit<ComboboxProps<T, boolean | undefined>, 'className'>
}

const Searchbox = <T,>({ children, searchboxDialogProps, searchboxInputProps, searchboxProps }: Props<T>) => (
  <Dialog {...searchboxDialogProps} className="relative z-10">
    <DialogBackdrop
      className="fixed inset-0 bg-gray-500 bg-opacity-25 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
      transition
    />

    <div className="fixed inset-0 z-10 w-screen overflow-y-auto p-4 sm:p-6 md:p-20">
      <DialogPanel
        className="mx-auto max-w-xl transform divide-y divide-gray-100 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 transition-all data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
        transition
      >
        <Combobox {...searchboxProps}>
          <SearchboxInput {...searchboxInputProps} />
          {children}
        </Combobox>
      </DialogPanel>
    </div>
  </Dialog>
)

export default Searchbox
