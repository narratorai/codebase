import { Field as HeadlessField, FieldProps as HeadlessFieldProps } from '@headlessui/react'

type Props = Omit<HeadlessFieldProps, 'as' | 'className'>

const RadioCardField = (props: Props) => <HeadlessField data-slot="field" {...props} />

export default RadioCardField
