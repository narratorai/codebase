import { TabPanel as HeadlessTabPanel, TabPanelProps as HeadlessTabPanelProps } from '@headlessui/react'

type Props = Omit<HeadlessTabPanelProps, 'className'>

const TabPanel = (props: Props) => <HeadlessTabPanel {...props} />

export default TabPanel
