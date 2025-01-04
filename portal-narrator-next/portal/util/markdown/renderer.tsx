import { defaultSchema } from 'hast-util-sanitize'
import { merge } from 'lodash'
import React from 'react'
import { Remark, RemarkProps } from 'react-remark'
import RehpyeMathjaxPlugin from 'rehype-mathjax/browser'
import RehypeRawPlugin from 'rehype-raw'
import RehypeSanitizePlugin from 'rehype-sanitize'
import RehypeSlugPlugin from 'rehype-slug'
import RemarkDirectivePlugin from 'remark-directive'
import RemarkGFMPlugin from 'remark-gfm'
import { CodeBlock, HeadingRenderer, Link, Span } from 'util/markdown/components'
import RehypeCodeBlockLangPlugin from 'util/markdown/rehypeCodeBlockLang'

import { colorDirective, videoDirective } from './directives'

// Default sanitization, with tweaks:
// - allow only certain class names (for video and math support)
// - allow data-* attributes
const sanitizationSchema = merge({}, defaultSchema, {
  attributes: {
    '*': ['data*'],
    span: [...(defaultSchema?.attributes?.span || []), ['className', 'mavis-video', 'math', 'math-inline']],
  },
  tagNames: defaultSchema.tagNames?.concat(['aside']),
})

const remarkConfig: RemarkProps = {
  remarkPlugins: [RemarkGFMPlugin, RemarkDirectivePlugin, videoDirective, colorDirective],
  remarkToRehypeOptions: {
    // Because we allow html input, make sure rehype-sanitize is in the rehypePlugins config!!
    allowDangerousHtml: true,
  },
  rehypePlugins: [
    RehypeRawPlugin,
    RehypeCodeBlockLangPlugin,
    RehpyeMathjaxPlugin,
    RehypeSlugPlugin,
    [RehypeSanitizePlugin, sanitizationSchema],
  ],
  rehypeReactOptions: {
    createElement: React.createElement,
    /* eslint-disable @typescript-eslint/ban-ts-comment */
    // @ts-ignore
    Fragment: React.Fragment,
    components: {
      // @ts-ignore: TODO figure out how to make these types happy
      h1: HeadingRenderer,
      // @ts-ignore
      h2: HeadingRenderer,
      // @ts-ignore
      h3: HeadingRenderer,
      // @ts-ignore
      h4: HeadingRenderer,
      // @ts-ignore
      h5: HeadingRenderer,
      // @ts-ignore
      h6: HeadingRenderer,
      // @ts-ignore
      a: Link,
      // @ts-ignore
      pre: CodeBlock,
      // @ts-ignore
      span: Span,
    },
    // @ts-ignore
    passNode: true,
    /* eslint-enable @typescript-eslint/ban-ts-comment */
  },
}

const RemarkRenderer = ({ source }: { source?: string | null }): JSX.Element => {
  return <Remark {...remarkConfig}>{source || ''}</Remark>
}

export default RemarkRenderer
