import MediaContent from 'components/shared/MediaContent'
import {
  FILE_TYPE_FIELDNAME,
  HEIGHT_FIELDNAME,
  MEDIA_FILENAME_FIELDNAME,
  MEDIA_SLUG_FIELDNAME,
} from 'components/shared/MediaUploader'
import { get, includes } from 'lodash'
import { CONTENT_TYPE_MEDIA_UPLOAD } from 'util/narratives/constants'

export interface IMediaContent {
  type: typeof CONTENT_TYPE_MEDIA_UPLOAD
  data: {
    filename: string
    height: number
    media_slug: string
    file_type: string
  }
}

interface Props {
  content: IMediaContent & { id: string }
}

const MediaItem = ({ content }: Props) => {
  const filename = get(content, MEDIA_FILENAME_FIELDNAME)
  const height = get(content, HEIGHT_FIELDNAME)
  const mediaSlug = get(content, MEDIA_SLUG_FIELDNAME)
  const fileType = get(content, FILE_TYPE_FIELDNAME)
  const isVideo = includes(fileType, 'video')

  return <MediaContent filename={filename} height={height} mediaSlug={mediaSlug} isVideo={isVideo} imageAsBackground />
}

export default MediaItem
