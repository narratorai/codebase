'use client'

import type { Editor } from '@tiptap/core'
import { Extension } from '@tiptap/core'
import { ReactRenderer } from '@tiptap/react'
import Suggestion from '@tiptap/suggestion'
import Fuse from 'fuse.js'
import { isEmpty } from 'lodash'
import type { RefObject } from 'react'
import tippy, { type GetReferenceClientRect, type Instance, type Props } from 'tippy.js'

import { slashCommandItems } from '.'
import { SlashCommandItem } from './items'
import SlashCommandMenu, { type Ref as SlashCommandMenuRef } from './SlashCommandMenu'

const renderItems = (elementRef?: RefObject<Element> | null) => {
  let reactRenderer: ReactRenderer<SlashCommandMenuRef, any> | null = null
  let popup: Instance<Props>[] | null = null

  return {
    onStart: (props: { editor: Editor; clientRect: DOMRect }) => {
      const { selection } = props.editor.state
      const parentNode = selection.$from.node(selection.$from.depth)
      const blockType = parentNode.type.name

      if (blockType === 'codeBlock') return false

      reactRenderer = new ReactRenderer(SlashCommandMenu, {
        props,
        editor: props.editor,
      })

      // @ts-expect-error Tippy does not recognize 'body' as a valid element
      popup = tippy('body', {
        getReferenceClientRect: props.clientRect,
        appendTo: () => (elementRef ? elementRef.current : document.body),
        content: reactRenderer.element,
        showOnCreate: true,
        interactive: true,
        trigger: 'manual',
        placement: 'bottom-start',
      })
    },

    onUpdate: (props: { editor: Editor; clientRect: GetReferenceClientRect }) => {
      reactRenderer?.updateProps(props)

      popup?.[0]?.setProps({
        getReferenceClientRect: props.clientRect,
      })
    },

    onKeyDown: (props: { event: KeyboardEvent }) => {
      if (props.event.key === 'Escape') {
        popup?.[0]?.hide()

        return true
      }

      return reactRenderer?.ref?.onKeyDown(props)
    },

    onExit: () => {
      popup?.[0]?.destroy()
      reactRenderer?.destroy()
    },
  }
}

interface SlashCommandOptions {
  char: string
  items: SlashCommandItem[]
  render: (elementRef?: RefObject<Element> | null) => any
}

const SlashCommand = Extension.create<SlashCommandOptions, any>({
  name: 'slash-command',

  addOptions() {
    return {
      char: '/',
      render: renderItems,
      items: slashCommandItems,
    }
  },

  addProseMirrorPlugins() {
    const { items, ...otherOptions } = this.options
    const fuse = new Fuse(items, { useExtendedSearch: true, threshold: 0.4, keys: ['title', 'tags'] })

    return [
      Suggestion({
        editor: this.editor,
        command: ({ editor, range, props }) => {
          props.command({ editor, range })
        },
        items: ({ query }) => (isEmpty(query) ? items : fuse.search(query).map((item) => item.item)),
        allow: ({ state, range }) => {
          const $from = state.doc.resolve(range.from)
          const isRootDepth = $from.depth === 1
          const isParagraph = $from.parent.type.name === 'paragraph'
          const isStartOfNode = $from.parent.textContent?.charAt(0) === '/'

          const afterContent = $from.parent.textContent?.substring($from.parent.textContent?.indexOf('/'))
          const isValidAfterContent = !afterContent?.endsWith('  ')

          return ((isRootDepth && isStartOfNode) || (isParagraph && isStartOfNode)) && isValidAfterContent
        },
        ...otherOptions,
      }),
    ]
  },
})

export default SlashCommand
