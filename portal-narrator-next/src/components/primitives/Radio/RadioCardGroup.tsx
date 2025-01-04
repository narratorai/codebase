import { RadioGroup as HeadlessRadioGroup, RadioGroupProps as HeadlessRadioGroupProps } from '@headlessui/react'

type Props = Omit<HeadlessRadioGroupProps, 'as' | 'className'>

const RadioCardGroup = (props: Props) => (
  <HeadlessRadioGroup data-slot="control" {...props} className="mt-6 grid grid-cols-1 gap-y-6" />
)

export default RadioCardGroup
