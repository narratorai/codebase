import {
  Dialog as HeadlessDialog,
  DialogBackdrop as HeadlessDialogBackdrop,
  DialogProps as HeadlessDialogProps,
} from '@headlessui/react'

import { SIZES } from './constants'
import DrawerBodyContainer from './DrawerBodyContainer'

type Props = { size?: keyof typeof SIZES; children: React.ReactNode } & Omit<HeadlessDialogProps, 'as' | 'className'>

const Drawer = ({ children, size = 'lg', ...props }: Props) => (
  <HeadlessDialog {...props}>
    <HeadlessDialogBackdrop
      className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity duration-500 ease-in-out data-[closed]:opacity-0"
      transition
    />

    <DrawerBodyContainer size={size}>{children}</DrawerBodyContainer>
  </HeadlessDialog>
)

export default Drawer
