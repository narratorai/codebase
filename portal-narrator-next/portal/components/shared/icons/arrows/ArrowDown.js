import styled from 'styled-components'
import { colors } from 'util/constants'
import ArrowDown from 'static/img/arrowDown.svg'
import _ from 'lodash'

const StyledArrowDown = styled(ArrowDown)`
  svg,
  use,
  polygon,
  path {
    fill: ${(props) => _.get(colors, props.color) || colors.black};
  }
`

StyledArrowDown.defaultProps = {
  width: 12,
  height: 12,
}

export default StyledArrowDown
