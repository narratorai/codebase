import { Trigger } from '@/components/shared/Tabs'

interface Props {
  children: React.ReactNode
  value: string
}

const TabTrigger = ({ children, value }: Props) => (
  <Trigger className="p-2" value={value}>
    {children}
  </Trigger>
)

export default TabTrigger
