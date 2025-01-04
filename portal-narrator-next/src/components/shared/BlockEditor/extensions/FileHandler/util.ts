import { Editor, FocusPosition } from '@tiptap/core'

import { postMavis } from '@/util/mavisClient'

type AttachmentsUploadResponse = {
  id: string
  fileExtension: string
}

/**
 * Upload files to the Mavis server.
 */
export function uploadFile(file: File) {
  const data = new FormData()
  data.append('file', file)

  return postMavis<AttachmentsUploadResponse, FormData>('/api/attachments', { data })
}

/**
 * Upload files to the Mavis server and insert them into the editor.
 */
export function uploadAndInsert(editor: Editor, files: File[], position?: FocusPosition) {
  for (const file of files) {
    const isImage = file.type.startsWith('image/')

    uploadFile(file).then((response) => {
      const dataSrc = `${response.id}.${response.fileExtension}`

      const chain = editor.chain().focus(position)
      if (isImage) chain.setRemoteImage({ title: file.name, alt: file.name, dataSrc })
      else chain.setRemoteFile({ title: file.name, dataSrc, mimeType: file.type })
      chain.run()
    })
  }
}
