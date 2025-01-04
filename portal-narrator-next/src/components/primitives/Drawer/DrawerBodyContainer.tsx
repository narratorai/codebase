import { DialogPanel as HeadlessDialogPanel } from '@headlessui/react'
import clsx from 'clsx'

import { SIZES } from './constants'

interface Props {
  children: React.ReactNode
  size?: keyof typeof SIZES
}

const DrawerBodyContainer = ({ children, size = 'lg' }: Props) => (
  <div className="fixed inset-0 overflow-hidden">
    <div className="absolute inset-0 overflow-hidden">
      <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
        <HeadlessDialogPanel
          className={clsx(
            'pointer-events-auto w-screen transform transition duration-500 ease-in-out data-[closed]:translate-x-full sm:duration-700',
            SIZES[size]
          )}
          transition
        >
          <div className="flex h-full flex-col gap-6 overflow-y-scroll bg-white py-6 shadow-xl">{children}</div>
        </HeadlessDialogPanel>
      </div>
    </div>
  </div>
)

export default DrawerBodyContainer
