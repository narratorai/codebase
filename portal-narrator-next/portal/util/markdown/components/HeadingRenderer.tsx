import { Typography } from 'components/shared/jawns'
import { trimStart } from 'lodash'
import React from 'react'
import type { Node } from 'unist'

interface Props extends React.HTMLAttributes<HTMLHeadingElement> {
  node: Node
  children: React.ReactNode
}

const HeadingRenderer = ({ node, children, ...props }: Props) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const level = trimStart(node.tagName as string, 'h')

  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    <Typography as={node.tagName as React.ElementType} type={`heading${level}`} mb={1} {...props}>
      {children}
    </Typography>
  )
}

export default HeadingRenderer
