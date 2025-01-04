import { Description as HeadlessDescription, DescriptionProps as HeadlessDescriptionProps } from '@headlessui/react'

import { Text } from '../Text'

type Props = Omit<HeadlessDescriptionProps<typeof Text>, 'as' | 'className'>

const DialogDescription = (props: Props) => (
  <div className="mt-2 text-pretty">
    <HeadlessDescription as={Text} {...props} />
  </div>
)

export default DialogDescription
