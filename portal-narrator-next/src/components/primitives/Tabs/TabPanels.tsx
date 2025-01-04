import { TabPanels as HeadlessTabPanels, TabPanelsProps as HeadlessTabPanelsProps } from '@headlessui/react'

type Props = Omit<HeadlessTabPanelsProps, 'className'>

const TabPanels = (props: Props) => <HeadlessTabPanels className="p-4" {...props} />

export default TabPanels
