import React from 'react'
import styled from 'styled-components'
import _ from 'lodash'
import { colors } from 'util/constants'
import DownloadSvg from 'static/img/download.svg'

const StyledDownload = styled((props) => <DownloadSvg {...props} />)`
  svg,
  use,
  path,
  rect {
    fill: ${(props) => _.get(colors, props.color) || colors.black};
  }
`

export default StyledDownload
