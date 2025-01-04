'use client'

import {
  Dialog as HeadlessDialog,
  DialogBackdrop as HeadlessDialogBackdrop,
  DialogPanel as HeadlessDialogPanel,
} from '@headlessui/react'
import React from 'react'

import { NavbarItem } from '../Navbar'
import MobileSidebarCloseButton from './MobileSidebarCloseButton'

type Props = React.PropsWithChildren<{ open: boolean; close: () => void }>

const MobileSidebar = ({ children, close, open }: Props) => (
  <HeadlessDialog className="lg:hidden" onClose={close} open={open}>
    <HeadlessDialogBackdrop
      className="fixed inset-0 bg-black/30 transition data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
      transition
    />
    <HeadlessDialogPanel
      className="fixed inset-y-0 w-full max-w-80 p-2 transition duration-300 ease-in-out data-[closed]:-translate-x-full"
      transition
    >
      <div className="flex h-full flex-col rounded-lg bg-white shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
        <div className="-mb-3 px-4 pt-3">
          <MobileSidebarCloseButton as={NavbarItem} />
        </div>
        {children}
      </div>
    </HeadlessDialogPanel>
  </HeadlessDialog>
)

export default MobileSidebar
