import DividerItem from './DividerItem'
import { IDividerItem } from './interfaces'

type Props = {
  children: React.ReactNode
} & Pick<IDividerItem, 'position'>

const DividerTitle = ({ children, ...props }: Props) => (
  <DividerItem {...props} padding="md">
    <span className="text-base font-semibold text-gray-900">{children}</span>
  </DividerItem>
)

export default DividerTitle
