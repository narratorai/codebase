import styled from 'styled-components'
import { colors } from 'util/constants'
import _ from 'lodash'

const Icon = styled(({ svg, colorAsHex, ...props }) => {
  // FIXME - I don't know why I have to do this, but I needed to change it to this after upgrading to react-scripts 3.x.x
  // https://create-react-app.dev/docs/adding-images-fonts-and-files/#adding-svgs
  if (_.get(svg, 'render')) {
    return svg.render(props)
  }

  if (_.get(svg, 'type.render')) {
    return svg.type.render(props)
  }

  if (_.isFunction(svg)) {
    return svg(props)
  }

  return null
})`
  use,
  path {
    fill: ${(props) => (props.colorAsHex ? props.color : _.get(colors, props.color) || colors.black)};
  }

  &:hover {
    path {
      fill: ${(props) => _.get(colors, props.hovercolor) || _.get(colors, props.color) || colors.black};
    }
  }
`

Icon.defaultProps = {
  width: 12,
  height: 12,
}

export default Icon
