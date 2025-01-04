import { Description as HeadlessDescription, DescriptionProps as HeadlessDescriptionProps } from '@headlessui/react'

type Props = Omit<HeadlessDescriptionProps, 'as' | 'className'>

const Description = (props: Props) => (
  <HeadlessDescription
    className="text-base/6 text-zinc-500 data-[disabled]:opacity-50 sm:text-sm/6 dark:text-zinc-400"
    data-slot="description"
    {...props}
  />
)

export default Description
