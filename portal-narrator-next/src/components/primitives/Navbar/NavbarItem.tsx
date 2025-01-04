'use client'

import { Button as HeadlessButton, ButtonProps as HeadlessButtonProps } from '@headlessui/react'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import React, { forwardRef } from 'react'

import { TouchTarget } from '../Button'
import { Link } from '../Link'

type NavbarItemRef = React.ForwardedRef<HTMLAnchorElement | HTMLButtonElement>

type Props = { current?: boolean; children: React.ReactNode } & (
  | Omit<HeadlessButtonProps, 'as' | 'className'>
  | Omit<React.ComponentPropsWithoutRef<typeof Link>, 'className'>
)

const NavbarItem = ({ children, current, ...props }: Props, ref: NavbarItemRef) => {
  const className = clsx(
    // Base
    'relative flex min-w-0 items-center gap-3 rounded-lg p-2 text-left text-base/6 font-medium text-zinc-950 sm:text-sm/5',
    // Leading icon/icon-only
    'data-[slot=icon]:*:size-6 data-[slot=icon]:*:shrink-0 sm:data-[slot=icon]:*:size-5',
    // Trailing icon (down chevron or similar)
    'data-[slot=icon]:last:[&:not(:nth-child(2))]:*:ml-auto data-[slot=icon]:last:[&:not(:nth-child(2))]:*:size-5 sm:data-[slot=icon]:last:[&:not(:nth-child(2))]:*:size-4',
    // Avatar
    'data-[slot=avatar]:*:-m-0.5 data-[slot=avatar]:*:size-7 data-[slot=avatar]:*:[--avatar-radius:theme(borderRadius.DEFAULT)] data-[slot=avatar]:*:[--ring-opacity:10%] sm:data-[slot=avatar]:*:size-6',
    // Hover
    'data-[hover]:bg-zinc-950/5',
    // Active
    'data-[active]:bg-zinc-950/5 data-[slot=icon]:*:data-[active]:fill-zinc-950',
    // Disabled
    'data-[disabled]:opacity-50',
    // Dark mode
    'dark:text-white dark:data-[slot=icon]:*:fill-zinc-400',
    'dark:data-[hover]:bg-white/5 dark:data-[slot=icon]:*:data-[hover]:fill-white',
    'dark:data-[active]:bg-white/5 dark:data-[slot=icon]:*:data-[active]:fill-white'
  )

  return (
    <span className="relative">
      {current && (
        <motion.span
          className="absolute inset-x-2 -bottom-2.5 h-0.5 rounded-full bg-zinc-950 dark:bg-white"
          layoutId="current-indicator"
        />
      )}
      {'href' in props ? (
        <Link
          className={className}
          data-current={current ? 'true' : undefined}
          ref={ref as React.ForwardedRef<HTMLAnchorElement>}
          {...props}
        >
          <TouchTarget>{children}</TouchTarget>
        </Link>
      ) : (
        <HeadlessButton
          className={clsx('cursor-default', className)}
          data-current={current ? 'true' : undefined}
          ref={ref}
          {...props}
        >
          <TouchTarget>{children}</TouchTarget>
        </HeadlessButton>
      )}
    </span>
  )
}

export default forwardRef(NavbarItem)
