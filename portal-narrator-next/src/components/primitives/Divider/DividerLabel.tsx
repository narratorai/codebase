import DividerItem from './DividerItem'
import { IDividerItem } from './interfaces'

type Props = {
  children: React.ReactNode
} & Pick<IDividerItem, 'position'>

const DividerLabel = ({ children, ...props }: Props) => (
  <DividerItem {...props} padding="sm">
    <span className="text-sm text-gray-500">{children}</span>
  </DividerItem>
)

export default DividerLabel
