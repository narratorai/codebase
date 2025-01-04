import React from 'react'
import styled from 'styled-components'
import { colors } from 'util/constants'
import _ from 'lodash'
import PlusSvg from 'static/img/plus.svg'

const Plus = styled((props) => <PlusSvg {...props} style={{ width: props.width || 12, height: props.height || 12 }} />)`
  svg,
  use {
    fill: ${(props) => _.get(colors, props.color) || colors.black};
  }
`

export default Plus
