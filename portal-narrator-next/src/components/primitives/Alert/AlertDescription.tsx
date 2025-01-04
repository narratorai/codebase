import { Description as HeadlessDescription, DescriptionProps as HeadlessDescriptionProps } from '@headlessui/react'

import { Text } from '../Text'

type Props = Omit<HeadlessDescriptionProps<typeof Text>, 'as' | 'className'>

const AlertDescription = (props: Props) => (
  <div className="mt-2 text-pretty text-center sm:text-left">
    <HeadlessDescription as={Text} {...props} />
  </div>
)

export default AlertDescription
