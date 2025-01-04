import { Description as HeadlessDescription, DescriptionProps as HeadlessDescriptionProps } from '@headlessui/react'

type Props = Omit<HeadlessDescriptionProps, 'as' | 'className'>

const ErrorMessage = (props: Props) => (
  <HeadlessDescription
    className="text-base/6 text-red-600 data-[disabled]:opacity-50 sm:text-sm/6 dark:text-red-500"
    data-slot="error"
    {...props}
  />
)

export default ErrorMessage
