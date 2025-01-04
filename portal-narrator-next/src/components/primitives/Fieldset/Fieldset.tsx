import { Fieldset as HeadlessFieldset, FieldsetProps as HeadlessFieldsetProps } from '@headlessui/react'

type Props = Omit<HeadlessFieldsetProps, 'as' | 'className'>

const Fieldset = (props: Props) => (
  <HeadlessFieldset className="[&>*+[data-slot=control]]:mt-6 [&>[data-slot=text]]:mt-1" {...props} />
)

export default Fieldset
