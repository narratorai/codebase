import { cloneDeep } from 'lodash'
import { PrismLight as SyntaxHighlighter, SyntaxHighlighterProps } from 'react-syntax-highlighter'
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json'
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql'
import { ghcolors, vs } from 'react-syntax-highlighter/dist/esm/styles/prism'
import type { Node } from 'unist'

SyntaxHighlighter.registerLanguage('sql', sql)
SyntaxHighlighter.registerLanguage('json', json)

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
  // Extract the code block text from the AST, as a string
  const code = node.children
    ?.flatMap((child) => child.children?.map((c) => c.value))
    .join('')
    .trim()

  return (
    <SyntaxHighlighter language={node.properties.lang} style={node.properties.lang === 'sql' ? narratorSql : ghcolors}>
      {code}
    </SyntaxHighlighter>
  )
}

export default CodeBlock
