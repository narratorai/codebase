import { Label, Tag } from '@/components/shared/Tag'

interface Props {
  color: 'transparent' | 'white' | 'green' | 'red' | 'purple' | 'yellow' | 'blue' | 'pink' | 'pink-purple' | 'gray'
  children: React.ReactNode
}

const TokenTag = ({ color, children }: Props) => (
  <Tag size="md" color={color} border>
    <Label>{children}</Label>
  </Tag>
)

export default TokenTag
