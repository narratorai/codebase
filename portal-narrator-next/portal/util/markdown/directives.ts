/* eslint-disable @typescript-eslint/ban-ts-comment */
import { visit } from 'unist-util-visit'

// ::video[My Title]{id=1234}
export const videoDirective = () => {
  return (tree: any) => {
    visit(tree, (node) => {
      // @ts-ignore
      if (node.type === 'leafDirective' && node.name === 'video') {
        const data = node.data || (node.data = {})

        // @ts-ignore
        const attributes = node.attributes as Record<string, string>

        // @ts-ignore
        const children = node.children as { value: string }[]

        const title = children && children.length > 0 ? children[0].value : null
        const { id, width, height } = attributes

        if (title && id) {
          const url = `https://cloudflarestream.com/${id}/manifest/video.m3u8`
          data.hName = 'span'
          data.hProperties = {
            className: 'mavis-video',
            dataUrl: url,
            dataTitle: title,
            width: width,
            height: height,
          }
        }
      }
    })
  }
}

// :color[something purple]{color=purple500}
// :::color{color=green300}
//   # section
// :::
export const colorDirective = () => {
  return (tree: any) => {
    visit(tree, (node) => {
      // @ts-ignore
      if (['textDirective', 'containerDirective'].includes(node.type) && node.name === 'color') {
        const data = node.data || (node.data = {})
        // @ts-ignore
        const attributes = node.attributes as Record<string, string>
        const color = attributes.color

        data.hName = 'span'
        data.hProperties = {
          dataColor: color,
        }
      }
    })
  }
}
