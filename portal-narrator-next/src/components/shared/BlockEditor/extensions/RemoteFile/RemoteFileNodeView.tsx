import { NodeViewProps, NodeViewWrapper } from '@tiptap/react'
import { isEmpty } from 'lodash'

import ResizableNodeContentContainer from '../../shared/ResizableNodeContentContainer'
import RemoteFileNodePlaceholder from './RemoteFileNodePlaceholder'

interface FileNodeAttrs {
  dataSrc: string
  height: number
  mimeType: string
  title: string
  uid: string
  width: string
}

export default function FileNodeView({ editor, node, updateAttributes, extension }: NodeViewProps) {
  const attrs = node.attrs as FileNodeAttrs
  const { uid, width, height, mimeType } = attrs
  const href = `${extension.options.baseUrl}/${attrs.dataSrc}`
  const isVideo = mimeType?.startsWith('video/')

  const handleUpload = (dataSrc: string, title: string, mimeType: string) => {
    updateAttributes({ dataSrc, title, mimeType })
  }

  if (isEmpty(attrs.dataSrc)) {
    return (
      <NodeViewWrapper uid={uid}>
        <RemoteFileNodePlaceholder onUpload={handleUpload} />
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper uid={uid}>
      <ResizableNodeContentContainer
        height={height}
        onResize={updateAttributes}
        resizeDirection={editor.isEditable ? 'both' : 'none'}
        width={width}
      >
        {isVideo ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video className="h-full w-full" controls>
            <source src={href} type={mimeType}></source>
          </video>
        ) : (
          <object className="h-full w-full" data={href}></object>
        )}
      </ResizableNodeContentContainer>
    </NodeViewWrapper>
  )
}
