import { Field as HeadlessField, FieldProps as HeadlessFieldProps } from '@headlessui/react'
import clsx from 'clsx'

type Props = Omit<HeadlessFieldProps, 'as' | 'className'>

const SwitchField = (props: Props) => (
  <HeadlessField
    className={clsx(
      // Base layout
      'grid grid-cols-[1fr_auto] items-center gap-x-8 gap-y-1 sm:grid-cols-[1fr_auto]',
      // Control layout
      '[&>[data-slot=control]]:col-start-2 [&>[data-slot=control]]:self-center',
      // Label layout
      '[&>[data-slot=label]]:col-start-1 [&>[data-slot=label]]:row-start-1 [&>[data-slot=label]]:justify-self-start',
      // Description layout
      '[&>[data-slot=description]]:col-start-1 [&>[data-slot=description]]:row-start-2',
      // With description
      '[&_[data-slot=label]]:has-[[data-slot=description]]:font-medium'
    )}
    data-slot="field"
    {...props}
  />
)

export default SwitchField
