import DefaultPlaceholder from '@tiptap/extension-placeholder'
import { Node } from '@tiptap/pm/model'

/**
 * Render the placeholder for a node.
 */
function renderPlaceholder({ node }: { node: Node }) {
  const { type, attrs } = node

  if (type.name === 'heading') return `Heading ${attrs.level}`
  if (type.name === 'bulletList') return 'List'
  if (type.name === 'orderedList') return 'List'
  if (type.name === 'taskList') return 'To-do'
  if (type.name === 'blockquote') return 'Empty quote'
  if (type.name === 'codeBlock') return ''
  if (type.name === 'columnBlock') return ''
  if (type.name === 'callout') return ''
  if (type.name === 'plot') return ''
  if (type.name === 'table') return ''

  return "Write something, or press '/' for commands"
}

export const Placeholder = DefaultPlaceholder.extend({
  addOptions() {
    return {
      ...this.parent?.(),
      placeholder: renderPlaceholder,
    }
  },
})

export default Placeholder
