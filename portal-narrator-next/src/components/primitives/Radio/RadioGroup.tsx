import { RadioGroup as HeadlessRadioGroup, RadioGroupProps as HeadlessRadioGroupProps } from '@headlessui/react'
import clsx from 'clsx'

type Props = Omit<HeadlessRadioGroupProps, 'as' | 'className'>

const RadioGroup = (props: Props) => (
  <HeadlessRadioGroup
    className={clsx(
      // Basic groups
      'space-y-3 [&_[data-slot=label]]:font-normal',
      // With descriptions
      'has-[[data-slot=description]]:space-y-6 [&_[data-slot=label]]:has-[[data-slot=description]]:font-medium'
    )}
    data-slot="control"
    {...props}
  />
)

export default RadioGroup
