import { Spin } from 'antd-next'
import { useCompileContent } from 'components/Narratives/hooks'
import { IContent } from 'components/Narratives/interfaces'
import { Box } from 'components/shared/jawns'
import MarkdownRenderer from 'components/shared/MarkdownRenderer'
import { head } from 'lodash'
import React from 'react'
import { highlightSourceTokens } from 'util/narratives/helpers'

import InnerContent from './InnerContent'

interface Props {
  content: IContent
}

const MarkdownItem = ({ content }: Props) => {
  const text = content.text || ''

  // compile markdown to respect spacing (i.e. /n/n -> <br>)
  const {
    loading: loadingText,
    error: compileError,
    response: compiledText,
  } = useCompileContent({
    contents: [
      {
        type: 'markdown',
        text,
      },
    ],
  })

  const markdownText = head(compiledText)?.text
  const previewText = compileError || markdownText

  return (
    <InnerContent content={content}>
      <Box>
        <Spin spinning={loadingText}>
          {previewText && <MarkdownRenderer source={highlightSourceTokens(previewText as string)} />}
        </Spin>
      </Box>
    </InnerContent>
  )
}

export default MarkdownItem
