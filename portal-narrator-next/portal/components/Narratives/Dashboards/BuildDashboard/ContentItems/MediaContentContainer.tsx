import InnerContent from 'components/Narratives/Dashboards/BuildDashboard/ContentItems/InnerContent'
import { IContent } from 'components/Narratives/interfaces'
import MediaContent from 'components/shared/MediaContent'
import {
  FILE_TYPE_FIELDNAME,
  HEIGHT_FIELDNAME,
  MEDIA_FILENAME_FIELDNAME,
  MEDIA_SLUG_FIELDNAME,
} from 'components/shared/MediaUploader'
import { get, includes } from 'lodash'
import styled from 'styled-components'

export const StyledImage = styled.div<{ src: string }>`
  background-image: url(${({ src }) => src});
  background-size: contain;
  width: 100%;
  height: 100%;
`

interface Props {
  content: IContent
}

const MediaContentContainer = ({ content }: Props) => {
  const filename = get(content, MEDIA_FILENAME_FIELDNAME)
  const height = get(content, HEIGHT_FIELDNAME)
  const mediaSlug = get(content, MEDIA_SLUG_FIELDNAME)
  const fileType = get(content, FILE_TYPE_FIELDNAME)
  const isVideo = includes(fileType, 'video')

  return (
    <InnerContent content={content}>
      <MediaContent filename={filename} height={height} mediaSlug={mediaSlug} isVideo={isVideo} imageAsBackground />
    </InnerContent>
  )
}

export default MediaContentContainer
