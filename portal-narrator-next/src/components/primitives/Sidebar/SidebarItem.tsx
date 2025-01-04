'use client'

import {
  Button as HeadlessButton,
  ButtonProps as HeadlessButtonProps,
  CloseButton as HeadlessCloseButton,
} from '@headlessui/react'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import React, { forwardRef, Fragment } from 'react'

import { TouchTarget } from '../Button'
import { Link } from '../Link'

type SidebarItemRef = React.ForwardedRef<HTMLAnchorElement | HTMLButtonElement>
type Props = { current?: boolean; children: React.ReactNode } & (
  | Omit<HeadlessButtonProps, 'as' | 'className'>
  | Omit<React.ComponentPropsWithoutRef<typeof Link>, 'className'>
)

const SidebarItem = ({ children, current, ...props }: Props, ref: SidebarItemRef) => {
  const className = clsx(
    // Base
    'flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-base/6 font-medium text-gray-950 sm:px-2 sm:py-2 sm:text-sm/5',
    // Leading icon/icon-only
    'data-[slot=icon]:*:size-6 data-[slot=icon]:*:shrink-0 sm:data-[slot=icon]:*:size-5',
    // Trailing icon (down chevron or similar)
    // 'data-[slot=icon]:last:*:ml-auto data-[slot=icon]:last:*:size-5 sm:data-[slot=icon]:last:*:size-4',
    // Avatar
    'data-[slot=avatar]:*:-m-0.5 data-[slot=avatar]:*:size-7 data-[slot=avatar]:*:[--ring-opacity:10%] sm:data-[slot=avatar]:*:size-6',
    // Hover
    'data-[hover]:bg-gray-950/5',
    // Active
    'data-[active]:bg-gray-950/5',
    // Current
    'data-[current]:bg-gray-950/5',
    // Dark mode
    'dark:text-gray-400',
    'dark:data-[hover]:bg-gray-800 dark:data-[hover]:text-white',
    'dark:data-[active]:text-white',
    'dark:data-[current]:text-white'
  )

  return (
    <span className="relative">
      {current && (
        <motion.span
          className="absolute inset-y-2 -left-4 w-0.5 rounded-full bg-gray-950 dark:bg-white"
          layoutId="current-indicator"
        />
      )}
      {'href' in props ? (
        <HeadlessCloseButton as={Fragment} ref={ref}>
          <Link className={className} {...props} data-current={current ? 'true' : undefined}>
            <TouchTarget>{children}</TouchTarget>
          </Link>
        </HeadlessCloseButton>
      ) : (
        <HeadlessButton
          {...props}
          className={clsx('cursor-default', className)}
          data-current={current ? 'true' : undefined}
          ref={ref}
        >
          <TouchTarget>{children}</TouchTarget>
        </HeadlessButton>
      )}
    </span>
  )
}

export default forwardRef(SidebarItem)
