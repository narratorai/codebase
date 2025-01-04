import styled from 'styled-components'
import { colors } from 'util/constants'
import ArrowForward from 'static/img/arrowForward.svg'
import _ from 'lodash'

const StyledArrowForward = styled(ArrowForward)`
  svg,
  use,
  path {
    fill: ${(props) => _.get(colors, props.color) || colors.black};
  }
`

StyledArrowForward.defaultProps = {
  width: 12,
  height: 12,
}

export default StyledArrowForward
