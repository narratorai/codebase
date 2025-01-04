import Image, { ImageOptions } from '@tiptap/extension-image'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    remoteImage: {
      /**
       * Add a remote image
       * @param options The image attributes
       * @example
       * editor
       *   .commands
       *   .setImage({ dataSrc: '948f141f-c10f-4c92.png', alt: 'tiptap', title: 'Logo' })
       */
      setRemoteImage: (options: { alt?: string; title?: string; dataSrc: string }) => ReturnType
    }
  }
}

interface RemoteImageOptions extends ImageOptions {
  baseUrl: string
}

/**
 * Image extension that allows to load images from a remote server.
 */
export const RemoteImage = Image.extend<RemoteImageOptions>({
  addAttributes() {
    return {
      ...this.parent?.(),
      dataSrc: {
        default: null,
        parseHTML: (element) => ({ dataSrc: element.getAttribute('data-src') }),
        renderHTML: (attributes) => {
          const src = `${this.options.baseUrl}/${attributes.dataSrc}`

          return {
            src,
            'data-src': attributes.dataSrc, // Keep the original data-src attribute to get it at parsing
          }
        },
      },
    }
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setRemoteImage:
        (options) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: options }),
    }
  },
})

export default RemoteImage
