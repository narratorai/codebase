import { StyledImage } from 'components/Narratives/Dashboards/BuildDashboard/ContentItems/ImageContent'
import { CONTENT_TYPE_IMAGE_UPLOAD } from 'util/narratives/constants'

export interface ImageContent {
  type: typeof CONTENT_TYPE_IMAGE_UPLOAD
  data: {
    image: string
  }
}

interface Props {
  content: ImageContent & { id: string }
}

const ImageItem = ({ content }: Props) => {
  const src = content.data.image

  return <StyledImage src={src} />
}

export default ImageItem
