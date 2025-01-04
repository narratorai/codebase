import { Box } from 'components/shared/jawns'
import { VideoPlayer } from 'components/shared/VideoPlayer'
import { get } from 'lodash'
import React from 'react'
import type { Node } from 'unist'

import { colors } from '../../constants'

const MathComponent = React.lazy(async () => {
  const { MathComponent } = await import(/* webpackChunkName: "mathjax" */ 'mathjax-react')
  return { default: MathComponent }
})

type SpanNode = Node & {
  properties: {
    className?: string[]
    width?: string
    height?: string
  }
  children: {
    value: string
  }[]
}

interface Props {
  node: SpanNode
  children: React.ReactNode
}

const Span = ({ node, children }: Props) => {
  const { className } = node.properties

  // math, math-display, and math-inline classes are added via mavis
  // if this is a math node, render via mathjax
  if (className?.includes('math')) {
    // Extract the formula block text from the AST, as a string
    const formula = node.children
      // Remove math delimiters
      .filter((child) => !['\\(', '\\)', '\\[', '\\]'].includes(child.value))
      // Join the rest of the content!
      .map((child) => child.value)
      .join('')
      .trim()

    // Controls whether is rendered inline or block
    const displayBlock = !className?.includes('math-inline')

    return <MathComponent tex={formula} display={displayBlock} />
  }

  // Support ::video[title]{url="https://myvideo"}
  if (className?.includes('mavis-video')) {
    const url = get(node, 'properties.dataUrl') as string
    const title = get(node, 'properties.dataTitle') as string

    const { width, height } = node.properties

    if (url && title) {
      return (
        <Box mx="auto" width={width} height={height}>
          <VideoPlayer title={title} url={url} />
        </Box>
      )
    }
  }

  // Support <span data-color="blue"> for setting text color
  let style = undefined
  const colorName = get(node, 'properties.dataColor') as string | undefined

  if (colorName) {
    const color = colors[colorName]
    if (color) {
      style = { color: color }
    }
  }

  // otherwise, render a span
  return <span style={style}>{children}</span>
}

export default Span
