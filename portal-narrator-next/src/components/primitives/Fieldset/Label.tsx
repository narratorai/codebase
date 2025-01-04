import { Label as HeadlessLabel, LabelProps as HeadlessLabelProps } from '@headlessui/react'

type Props = Omit<HeadlessLabelProps, 'as' | 'className'>

const Label = (props: Props) => (
  <HeadlessLabel
    className="select-none text-base/6 text-zinc-950 data-[disabled]:opacity-50 sm:text-sm/6 dark:text-white"
    data-slot="label"
    {...props}
  />
)

export default Label
