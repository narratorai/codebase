import { IContent } from 'components/Narratives/interfaces'
import { isString } from 'lodash'
import styled from 'styled-components'

import InnerContent from './InnerContent'

interface Props {
  content: IContent
}

export const StyledImage = styled.div<{ src: string }>`
  background-image: url(${({ src }) => src});
  background-size: contain;
  width: 100%;
  height: 100%;
`

const ImageContent = ({ content }: Props) => {
  return (
    <InnerContent content={content}>
      {content?.data?.image && isString(content.data.image) && <StyledImage src={content.data.image} />}
    </InnerContent>
  )
}

export default ImageContent
