import { mergeAttributes } from '@tiptap/core'
import CodeBlockLowlight, { CodeBlockLowlightOptions } from '@tiptap/extension-code-block-lowlight'

import { availableLanguages, lowlightInstance } from './utils'

/**
 * Extension to highlight code blocks with lowlight and change the language.
 *
 * @see https://tiptap.dev/api/nodes/code-block-lowlight
 */
export const CodeBlock = CodeBlockLowlight.extend<CodeBlockLowlightOptions>({
  addOptions() {
    return {
      ...this.parent?.(),
      lowlight: lowlightInstance,
    }
  },

  addNodeView() {
    return ({ editor, node, getPos, HTMLAttributes }) => {
      const dom = document.createElement('div')
      dom.classList.add('relative')

      const contentDOMWrapper = document.createElement('pre')
      const attributes = mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)
      for (const key in attributes) {
        contentDOMWrapper.setAttribute(key, attributes[key])
      }

      const contentDOM = document.createElement('code')
      contentDOMWrapper.appendChild(contentDOM)

      const languageSelector = document.createElement('select')
      availableLanguages.forEach((language) => {
        const option = document.createElement('option')
        option.value = language.value
        option.innerText = language.label
        languageSelector.appendChild(option)
      })
      languageSelector.value = node.attrs.language || this.options.defaultLanguage
      languageSelector.classList.add(
        'absolute',
        'top-2',
        'right-1',
        'appearance-none',
        'bg-transparent',
        'py-1.5',
        'pl-2',
        'pr-7',
        'text-xs',
        'text-gray-500',
        'truncate',
        'max-w-32',
        'border-none',
        'text-right',
        'focus:ring-0',
        'cursor-pointer'
      )

      languageSelector.addEventListener('change', (event) => {
        editor.commands.command(({ tr }) => {
          const pos = getPos()
          if (typeof pos !== 'number') {
            return false
          }

          tr.setNodeMarkup(pos, undefined, { language: (event.target as HTMLSelectElement).value })
          return true
        })
      })

      // IMPORTANT: The order children matters to ensure the cursor can navigate the code block correctly
      dom.appendChild(contentDOMWrapper)
      dom.appendChild(languageSelector)

      return {
        dom,
        contentDOM: contentDOM,
      }
    }
  },
})

export default CodeBlock
