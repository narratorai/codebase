import { Textarea as HeadlessTextarea, TextareaProps as HeadlessTextareaProps } from '@headlessui/react'
import clsx from 'clsx'
import type React from 'react'
import { forwardRef, Fragment } from 'react'

type TextareaRef = React.ForwardedRef<HTMLTextAreaElement>
type Props = {
  resizable?: boolean
  children?: React.ReactNode
} & Omit<HeadlessTextareaProps, 'as' | 'className'>

const Textarea = ({ children, invalid, placeholder, resizable = true, ...props }: Props, ref: TextareaRef) => (
  <HeadlessTextarea as={Fragment} invalid={invalid} ref={ref} {...props}>
    <div
      className={clsx([
        // Basic layout
        'relative block h-full w-full appearance-none rounded-lg',
        // Focus ring
        'ring-1 ring-transparent focus-within:ring-1 focus-within:ring-indigo-500',
        // Border
        'border border-zinc-950/10 shadow data-[hover]:border-zinc-950/20 dark:border-white/10 dark:data-[hover]:border-white/20',
        // Background color
        'bg-white dark:bg-white/5',
        // Hide default focus styles
        'focus:outline-none',
        // Focused state
        'focus-within:border-indigo-500',
        // Invalid state
        'data-[invalid]:border-red-500 data-[invalid]:data-[hover]:border-red-500 focus-within:data-[invalid]:border-red-500 focus-within:data-[invalid]:data-[hover]:border-red-500 data-[invalid]:dark:border-red-600 data-[invalid]:data-[hover]:dark:border-red-600',
        // Disabled state
        'data-[disabled]:border-zinc-950/20 dark:data-[hover]:data-[disabled]:border-white/15 data-[disabled]:dark:border-white/15',
        'data-[disabled]:bg-zinc-950/5 data-[disabled]:opacity-50 data-[disabled]:shadow-none data-[disabled]:dark:bg-white/[2.5%]',
        // Resizable
        resizable ? 'resize-y' : 'resize-none',
      ])}
      data-slot="control"
    >
      <label className="sr-only" htmlFor="comment">
        {placeholder}
      </label>
      <textarea
        {...props}
        className={clsx([
          'block w-full border-0 bg-transparent px-4 py-2 text-base/6 text-zinc-950 placeholder:text-zinc-500 focus:ring-0 sm:px-3 sm:text-sm/6 dark:text-white',
          resizable ? 'resize-y' : 'resize-none',
        ])}
        placeholder={placeholder}
      />
      {children}
    </div>
  </HeadlessTextarea>
)

export default forwardRef(Textarea)
