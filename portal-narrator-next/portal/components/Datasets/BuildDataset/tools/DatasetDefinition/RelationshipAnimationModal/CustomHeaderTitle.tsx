import styled from 'styled-components'
import { ATTRIBUTE_COLOR, BEHAVIOR_COLOR } from 'util/datasets'

interface Props {
  type: 'append' | 'cohort'
  children: React.ReactNode
}

// Mimics the top border above the table from DatasetTable
const CustomHeaderBorderColor = styled(({ type, ...props }) => <div {...props} />)`
  border-top: 4px solid ${({ theme, type }) => theme.colors[type === 'append' ? ATTRIBUTE_COLOR : BEHAVIOR_COLOR]};
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
`

const CustomHeaderTitle = ({ type, children }: Props) => (
  <div style={{ maxWidth: 160 }}>
    <CustomHeaderBorderColor type={type} />
    {children}
  </div>
)

export default CustomHeaderTitle
