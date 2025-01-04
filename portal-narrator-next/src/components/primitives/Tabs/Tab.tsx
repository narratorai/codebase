import { Tab as HeadlessTab, TabProps as HeadlessTabProps } from '@headlessui/react'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { Fragment } from 'react'

type Props = {
  children: React.ReactNode
} & Omit<HeadlessTabProps, 'className' | 'as'>

const Tab = ({ children, ...props }: Props) => (
  <HeadlessTab as={Fragment} {...props}>
    {({ selected }) => (
      <div className="group relative">
        <button
          className={clsx(
            // Button
            'inline-flex items-center gap-2 border-b-2 border-transparent px-1 py-4 text-sm font-medium text-gray-500 group-data-[hover]:border-gray-300 group-data-[hover]:text-gray-700 group-data-[selected]:text-indigo-600',
            // Icon
            '[&>[data-slot=icon]]:h-5 [&>[data-slot=icon]]:w-5 [&>[data-slot=icon]]:text-gray-400 [&>[data-slot=icon]]:group-hover:text-gray-500 [&>[data-slot=icon]]:group-data-[selected]:text-indigo-500'
          )}
        >
          {children}
        </button>
        {selected && (
          <motion.span
            className="absolute inset-x-0 -bottom-0 h-0.5 rounded-full bg-indigo-500 dark:bg-white"
            layoutId="current-indicator"
          />
        )}
      </div>
    )}
  </HeadlessTab>
)

export default Tab
