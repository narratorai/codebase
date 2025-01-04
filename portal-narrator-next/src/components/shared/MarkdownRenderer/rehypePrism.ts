// Sets the language of a code block on a node's properties

import { visit } from 'unist-util-visit'

function getLanguage(node: any) {
  const className = node.properties.className || []

  for (const classListItem of className) {
    if (classListItem.slice(0, 9) === 'language-') {
      return classListItem.slice(9).toLowerCase()
    }
  }

  return null
}

const rehypePrism = () => {
  return (tree: any) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    visit(tree, 'element', visitor)
  }

  function visitor(node: any, index: number, parent: any) {
    if (!parent || parent.tagName !== 'pre' || node.tagName !== 'code') {
      return
    }

    const lang = getLanguage(node)

    if (lang === null) {
      return
    }

    parent.properties.className = (parent.properties.className || []).concat('language-' + lang)
    parent.properties.lang = lang
  }
}

export default rehypePrism
