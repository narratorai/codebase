// Sets the language of a code block on a node's properties

import { visit } from 'unist-util-visit'

const rehypePrism = () => {
  return (tree) => {
    visit(tree, 'element', visitor)
  }

  function visitor(node, index, parent) {
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

function getLanguage(node) {
  const className = node.properties.className || []

  for (const classListItem of className) {
    if (classListItem.slice(0, 9) === 'language-') {
      return classListItem.slice(9).toLowerCase()
    }
  }

  return null
}

export default rehypePrism
