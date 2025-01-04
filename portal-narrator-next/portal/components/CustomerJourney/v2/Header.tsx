import { Radio, RadioChangeEvent } from 'antd-next'
import { Flex } from 'components/shared/jawns'

import { TOPBAR_HEIGHT } from './constants'

interface Props {
  asVisual?: boolean
  onChange: (asVisual: boolean) => void
}

const TIMELINE = 'timeline'
const VISUAL = 'visual'

const Header = ({ asVisual, onChange }: Props) => {
  const value = asVisual ? VISUAL : TIMELINE

  const handleChange = (e: RadioChangeEvent) => {
    const { value } = e.target
    const asVisual = value === VISUAL

    onChange(asVisual)
  }

  return (
    <Flex
      justifyContent="center"
      alignItems="baseline"
      style={{ position: 'sticky', top: 0, height: `${TOPBAR_HEIGHT}px` }}
    >
      <Radio.Group value={value} onChange={handleChange} buttonStyle="solid">
        <Radio.Button value={TIMELINE}>Timeline</Radio.Button>
        <Radio.Button value={VISUAL}>Visual Summary</Radio.Button>
      </Radio.Group>
    </Flex>
  )
}

export default Header
