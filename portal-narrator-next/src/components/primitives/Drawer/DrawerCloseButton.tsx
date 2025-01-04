import { CloseButton as HeadlessCloseButton, CloseButtonProps as HeadlessCloseButtonProps } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { forwardRef } from 'react'

type ButtonRef = React.ForwardedRef<HTMLElement>

type Props = { label?: string } & Omit<HeadlessCloseButtonProps, 'as' | 'className'>

const DrawerCloseButton = ({ label, ...props }: Props, ref: ButtonRef) => (
  <div className="flex h-7 items-center">
    <HeadlessCloseButton
      className="relative rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      ref={ref}
      {...props}
    >
      <span className="absolute -inset-2.5" />
      <span className="sr-only">{label}</span>
      <XMarkIcon aria-hidden="true" className="h-6 w-6" />
    </HeadlessCloseButton>
  </div>
)

export default forwardRef(DrawerCloseButton)
