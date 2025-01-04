import clsx from 'clsx'
import { forwardRef } from 'react'

type Ref = React.ForwardedRef<HTMLDivElement>

type Props = Omit<React.ComponentPropsWithoutRef<'div'>, 'className'>

const SearchboxItemContents = (props: Props, ref: Ref) => (
  <div
    className={clsx(
      // Use grid layout
      'col-span-full grid w-full grid-cols-[auto_1fr_1fr_1fr_auto] items-center',

      // Small Leading Icon
      '[&>[data-slot=sm-lead-icon]]:col-start-1 [&>[data-slot=sm-lead-icon]]:row-start-1 [&>[data-slot=sm-lead-icon]]:mr-2',
      // Large Leading Icon
      '[&>[data-slot=lg-lead-icon]]:col-start-1 [&>[data-slot=lg-lead-icon]]:row-span-2 [&>[data-slot=lg-lead-icon]]:row-start-1 [&>[data-slot=lg-lead-icon]]:mr-2',

      // Small Trailing Icon
      '[&>[data-slot=sm-trail-icon]]:col-start-5 [&>[data-slot=sm-trail-icon]]:row-start-1 [&>[data-slot=sm-trail-icon]]:ml-2',
      // Large Trailing Icon
      '[&>[data-slot=lg-trail-icon]]:col-start-5 [&>[data-slot=lg-trail-icon]]:row-span-2 [&>[data-slot=lg-trail-icon]]:row-start-1 [&>[data-slot=lg-trail-icon]]:ml-2',

      // Small Title
      '[&>[data-slot=sm-title]]:col-start-2 [&>[data-slot=sm-title]]:row-start-1',
      // Medium Title
      '[&>[data-slot=md-title]]:col-span-2 [&>[data-slot=md-title]]:col-start-2 [&>[data-slot=md-title]]:row-start-1',
      // Long Title
      '[&>[data-slot=lg-title]]:col-span-3 [&>[data-slot=lg-title]]:col-start-2 [&>[data-slot=lg-title]]:row-start-1',

      // Small Details
      '[&>[data-slot=sm-details]]:col-start-4 [&>[data-slot=sm-details]]:row-start-1',
      // Medium Details
      '[&>[data-slot=md-details]]:col-span-2 [&>[data-slot=md-details]]:col-start-3 [&>[data-slot=md-details]]:row-start-1',

      // Small Subtitle
      '[&>[data-slot=sm-subtitle]]:col-start-2 [&>[data-slot=sm-subtitle]]:row-start-2',
      // Medium Subtitle
      '[&>[data-slot=md-subtitle]]:col-span-2 [&>[data-slot=md-subtitle]]:col-start-2 [&>[data-slot=md-subtitle]]:row-start-2',
      // Long Subtitle
      '[&>[data-slot=lg-subtitle]]:col-span-3 [&>[data-slot=lg-subtitle]]:col-start-2 [&>[data-slot=lg-subtitle]]:row-start-2',

      // Small Subdetails
      '[&>[data-slot=sm-subdetails]]:col-start-4 [&>[data-slot=sm-subdetails]]:row-start-2',
      // Medium Subdetails
      '[&>[data-slot=md-subdetails]]:col-span-2 [&>[data-slot=md-subdetails]]:col-start-3 [&>[data-slot=md-subdetails]]:row-start-2',

      // Selection
      '[&>[data-slot=selection]]:invisible [&>[data-slot=selection]]:col-start-5 [&>[data-slot=selection]]:row-start-1 [&>[data-slot=selection]]:ml-4 [&>[data-slot=selection]]:size-5 [&>[data-slot=selection]]:self-center [&>[data-slot=selection]]:justify-self-end [&>[data-slot=selection]]:text-gray-600 [&>[data-slot=selection]]:group-data-[selected]:visible [&>[data-slot=selection]]:sm:size-4'
    )}
    ref={ref}
    {...props}
  />
)

export default forwardRef(SearchboxItemContents)
