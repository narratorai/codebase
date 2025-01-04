import React from 'react'
import styled from 'styled-components'
import PlotSvg from 'static/img/plot.svg'
import { colors } from 'util/constants'
import _ from 'lodash'

const Plot = styled((props) => <PlotSvg {...props} style={{ width: props.width || 50, height: props.height || 50 }} />)`
  svg,
  use {
    fill: ${(props) => _.get(colors, props.color) || colors.black};
  }
`

export default Plot
