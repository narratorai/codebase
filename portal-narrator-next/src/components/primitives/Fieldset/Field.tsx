import { Field as HeadlessField, FieldProps as HeadlessFieldProps } from '@headlessui/react'
import clsx from 'clsx'

type Props = Omit<HeadlessFieldProps, 'as' | 'className'>

const Field = (props: Props) => (
  <HeadlessField
    className={clsx(
      '[&>[data-slot=label]+[data-slot=control]]:mt-3',
      '[&>[data-slot=label]+[data-slot=description]]:mt-1',
      '[&>[data-slot=description]+[data-slot=control]]:mt-3',
      '[&>[data-slot=control]+[data-slot=description]]:mt-3',
      '[&>[data-slot=control]+[data-slot=error]]:mt-3',
      '[&>[data-slot=label]]:font-medium'
    )}
    {...props}
  />
)

export default Field
