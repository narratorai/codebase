import { TabGroup as HeadlessTabGroup, TabGroupProps as HeadlessTabGroupProps } from '@headlessui/react'

type Props = Omit<HeadlessTabGroupProps, 'className'>

const Tabs = (props: Props) => <HeadlessTabGroup {...props} />

export default Tabs
