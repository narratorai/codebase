import styled from 'styled-components'
import { colors } from 'util/constants'
import ArrowBack from 'static/img/arrowBack.svg'

import _ from 'lodash'

const StyledArrowBack = styled(ArrowBack)`
  svg,
  use,
  path {
    fill: ${(props) => _.get(colors, props.color) || colors.black};
  }
`

StyledArrowBack.defaultProps = {
  width: 12,
  height: 12,
}

export default StyledArrowBack
