import { CaretUpOutlined } from '@ant-design/icons'
import styled, { css } from 'styled-components'

export type TimeResolution = 'day' | 'week' | 'month' | 'quarter' | 'year'
export type MetricFormat = 'percent' | 'number' | 'revenue' | 'string'

interface ArrowProps {
  lift: number
  color: string
}

const StyledArrow = styled(CaretUpOutlined)<{ up: boolean }>`
  ${({ up, color }) => css`
    color: ${color};
    margin-top: ${up ? '5px' : '4px'};
    margin-right: 3px;
  `}
`

const Arrow = ({ lift, color }: ArrowProps) => {
  const up = lift >= 0
  return <StyledArrow color={color} up={up} rotate={up ? undefined : 180} />
}

export default Arrow
