import { BlockContent } from 'util/blocks/interfaces'
import {
  CONTENT_TYPE_BLOCK_PLOT,
  CONTENT_TYPE_IMAGE_UPLOAD,
  CONTENT_TYPE_MARKDOWN,
  CONTENT_TYPE_MEDIA_UPLOAD,
  CONTENT_TYPE_METRIC_V2,
  CONTENT_TYPE_PLOT_V2,
  CONTENT_TYPE_RAW_METRIC,
  CONTENT_TYPE_TABLE,
  CONTENT_TYPE_TABLE_V2,
} from 'util/narratives/constants'

import ImageItem, { ImageContent } from './ImageItem'
import MarkdownItem from './MarkdownItem'
import MediaItem, { IMediaContent } from './MediaItem'
import MetricItem from './MetricItem'
import PlotItem from './PlotItem'
import TableItem from './TableItem'

export type AssembledContentItemContent = (BlockContent | ImageContent | IMediaContent) & { id: string }

interface Props {
  content: AssembledContentItemContent
}

const AssembledContentItem = ({ content }: Props) => {
  if (content.type === CONTENT_TYPE_MARKDOWN) {
    return <MarkdownItem content={content} />
  }

  if (content.type === CONTENT_TYPE_PLOT_V2 || content.type === CONTENT_TYPE_BLOCK_PLOT) {
    return <PlotItem content={content} />
  }

  if (content.type === CONTENT_TYPE_TABLE_V2 || content.type === CONTENT_TYPE_TABLE) {
    return <TableItem content={content} />
  }

  if (content.type === CONTENT_TYPE_METRIC_V2 || content.type === CONTENT_TYPE_RAW_METRIC) {
    return <MetricItem content={content} />
  }

  if (content.type === CONTENT_TYPE_IMAGE_UPLOAD) {
    return <ImageItem content={content} />
  }

  if (content.type === CONTENT_TYPE_MEDIA_UPLOAD) {
    return <MediaItem content={content} />
  }

  // shouldn't happen but return null for other types
  return null
}

export default AssembledContentItem
