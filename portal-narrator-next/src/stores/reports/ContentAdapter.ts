import { JSONContent } from '@tiptap/core'

import { IRemoteReportContent, IRemoteReportContentMeta } from './interfaces'

export default class ContentAdapter {
  /**
   * Converts the content from  JSONContent to the API format.
   */
  static formatJSONContent(content: JSONContent, text: string, meta: IRemoteReportContentMeta) {
    return {
      document: {
        type: 'prosemirrorSchema',
        content: content.content,
        text,
        meta,
      },
    }
  }

  /**
   * Converts the content from the API to JSONContent.
   * The API returns the type of the content as 'prosemirrorSchema'.
   */
  static getJSONContent(content?: IRemoteReportContent | null): JSONContent {
    const defaultDoc = {
      document: {
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
          },
        ],
        meta: { wordCount: 0 },
      },
    }
    const { document } = content ?? defaultDoc

    return {
      type: 'doc',
      content: document.content,
    }
  }
}
