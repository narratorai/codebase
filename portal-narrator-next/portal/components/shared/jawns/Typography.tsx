import { get } from 'lodash'
import React from 'react'
import { Text, TextProps } from 'rebass'
import { typography } from 'util/constants'

interface Props extends TextProps {
  fontStyle?: string
  truncate?: boolean
  nowrap?: boolean
}

const Typography = ({
  fontWeight,
  type = 'body100',
  fontStyle = 'normal',
  style = {},
  truncate,
  nowrap,
  mb = 0,
  ...props
}: Props) => (
  <Text
    fontSize={get(typography, `${type}.sizes`, [])}
    fontWeight={fontWeight || get(typography, `${type}.fontWeight`, 'normal')}
    lineHeight={get(typography, `${type}.lineHeights`, [1, 1, 1, 1])}
    mb={mb}
    style={{
      fontStyle,
      ...(truncate && { overflow: 'hidden' }),
      ...((truncate || nowrap) && { whiteSpace: 'nowrap' }),
      ...(truncate && { textOverflow: 'ellipsis' }),
      ...style,
    }}
    {...props}
  />
)

Typography.defaultProps = {
  mb: 0,
}

export default Typography
