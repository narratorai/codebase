import clsx from 'clsx'
import React, { ForwardedRef, forwardRef } from 'react'

interface Props extends React.InputHTMLAttributes<HTMLInputElement>, React.RefAttributes<HTMLInputElement> {
  LeadingIcon: React.ComponentType<React.ComponentProps<any>>
  TrailingIcon?: React.ComponentType<React.ComponentProps<any>>
}

const IconTextInput = ({ LeadingIcon, TrailingIcon, ...props }: Props, ref: ForwardedRef<HTMLInputElement>) => (
  <div className="relative">
    <LeadingIcon className="absolute bottom-0 left-0 top-0 box-content size-5 stroke-gray-600 p-2 text-gray-600" />
    <input
      {...props}
      ref={ref}
      type="text"
      className={clsx(
        'h-9 w-full rounded-xl py-2 outline-0 ring-0 bordered-gray-100 placeholder:text-gray-300 focus:border-gray-100 focus:shadow-focus focus:outline-0 focus:ring-0 active:shadow-focus',
        TrailingIcon ? 'px-9' : 'pl-9 pr-2'
      )}
    />
    {TrailingIcon && (
      <TrailingIcon className="absolute bottom-0 right-0 top-0 box-content size-5 stroke-gray-600 p-2 text-gray-600" />
    )}
  </div>
)

export default forwardRef(IconTextInput)
