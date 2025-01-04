import React from 'react'
import _ from 'lodash'
import { colors } from 'util/constants'
import styled from 'styled-components'
import CloseSvg from 'static/img/close.svg'

const StyledClose = styled((props) => (
  <CloseSvg {...props} style={{ width: props.width || 12, height: props.height || 12 }} />
))`
  cursor: pointer;

  svg,
  use,
  path,
  mask {
    fill: ${(props) => _.get(colors, props.color) || colors.black};
  }

  &:hover {
    svg,
    use,
    path,
    mask {
      fill: ${(props) => _.get(colors, props.color) || colors.gray500};
    }
  }
`

export default StyledClose
