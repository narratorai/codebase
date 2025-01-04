import { TabList as HeadlessTabList, TabListProps as HeadlessTabListProps } from '@headlessui/react'

type Props = Omit<HeadlessTabListProps, 'className'>

const TabList = ({ children, ...props }: Props) => (
  <div className="border-b border-gray-200">
    <HeadlessTabList className="-mb-px flex gap-8" {...props}>
      {children}
    </HeadlessTabList>
  </div>
)

export default TabList
