import { CaretRightOutlined, CopyOutlined } from '@ant-design/icons'
import { App, Tooltip } from 'antd-next'
import CopyToClipboard from 'components/shared/CopyToClipboard'
import { RunSqlContext } from 'components/shared/MarkdownEditor'
import { cloneDeep } from 'lodash'
import React, { useContext } from 'react'
import { PrismLight as SyntaxHighlighter, SyntaxHighlighterProps } from 'react-syntax-highlighter'
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json'
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql'
import { ghcolors, vs } from 'react-syntax-highlighter/dist/esm/styles/prism'
import styled from 'styled-components'
import type { Node } from 'unist'

SyntaxHighlighter.registerLanguage('sql', sql)
SyntaxHighlighter.registerLanguage('json', json)

const StyledCodeBlock = styled.div`
  position: relative;

  pre {
    padding-right: 40px !important;
  }

  code {
    white-space: break-spaces !important;
  }

  .code-options {
    position: absolute;
    top: 5px;
    right: 5px;
    padding: 8px;
    opacity: 0;
    will-change: opacity;
    transition: opacity 150ms ease-in-out;
    cursor: pointer;
    background-color: white;
    color: ${({ theme }) => theme.colors.gray700};
    border-radius: 4px;
    font-size: 15px;
  }

  &:hover .code-options {
    opacity: 1;
  }

  .anticon.anticon-copy {
    margin-left: 12px;
  }
`

//
// Custom style for sql in Markdown to match our Markdown editor (see monacoTheme.ts)
//
const narratorSql = cloneDeep(vs)
const selector = 'code[class*="language-"]'

narratorSql[selector]['fontFamily'] = 'Menlo, Monaco,"Courier New", monospace'
narratorSql[selector]['fontSize'] = '13px'
narratorSql['string'] = { color: 'red' }
narratorSql['number'] = { color: '#098658' }
narratorSql['comment'] = { color: '#008000' }

const keywordStyle = { color: '#0451a5' }
narratorSql['keyword'] = keywordStyle
narratorSql['boolean'] = keywordStyle // for NULL in sql

interface Props extends SyntaxHighlighterProps {
  node: Node & {
    properties: {
      // provided via custom RehypeCodeBlockLangPlugin
      lang: string
    }
    children: {
      children: {
        value: string
      }[]
    }[]
  }
}

const CodeBlock = ({ node }: Props) => {
  const { notification } = App.useApp()

  // Extract the code block text from the AST, as a string
  const code = node.children
    ?.flatMap((child) => child.children?.map((c) => c.value))
    .join('')
    .trim()

  const { runQuery } = useContext(RunSqlContext)

  const handleClick = (event: React.MouseEvent): void => {
    if (runQuery) {
      runQuery(code)
    }
    // we don't want this click to go beyond the run button to the code block.
    // in transformations that'll open it up fullscreen
    event.stopPropagation()
  }

  return (
    <StyledCodeBlock>
      <SyntaxHighlighter
        language={node.properties.lang}
        style={node.properties.lang === 'sql' ? narratorSql : ghcolors}
      >
        {code}
      </SyntaxHighlighter>
      <div className="code-options">
        {runQuery && (
          <Tooltip title="Run query">
            <CaretRightOutlined onClick={handleClick}>Run</CaretRightOutlined>
          </Tooltip>
        )}
        <CopyToClipboard
          text={code}
          onCopy={() => {
            notification.success({
              message: 'Copied to clipboard',
              placement: 'topRight',
              duration: 2,
            })
          }}
        >
          <Tooltip title="Copy">
            <CopyOutlined />
          </Tooltip>
        </CopyToClipboard>
      </div>
    </StyledCodeBlock>
  )
}

export default CodeBlock
