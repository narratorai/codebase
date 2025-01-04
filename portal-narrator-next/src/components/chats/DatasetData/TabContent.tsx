import { Content } from '@/components/shared/Tabs'

interface Props {
  children: React.ReactNode
  value: string
}

const TabContent = ({ children, value }: Props) => (
  <Content className="pt-4" value={value}>
    {children}
  </Content>
)

export default TabContent
