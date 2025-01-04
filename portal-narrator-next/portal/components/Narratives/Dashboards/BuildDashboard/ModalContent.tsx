import ImageUploaderContent from 'components/Narratives/BuildNarrative/Sections/BasicContent/ImageUploaderContent'
import MetricContent from 'components/Narratives/BuildNarrative/Sections/BasicContent/MetricContent'
import PlotContent from 'components/Narratives/BuildNarrative/Sections/BasicContent/PlotContent'
import TableContent from 'components/Narratives/BuildNarrative/Sections/BasicContent/TableContent'
import MarkdownContent from 'components/Narratives/BuildNarrative/Sections/MarkdownContent'
import { Box } from 'components/shared/jawns'
import MediaUploader from 'components/shared/MediaUploader'
import { noop } from 'lodash'
import { MutableRefObject } from 'react'
import { useField } from 'react-final-form'
import styled from 'styled-components'
import {
  CONTENT_TYPE_IMAGE_UPLOAD,
  CONTENT_TYPE_MARKDOWN,
  CONTENT_TYPE_MEDIA_UPLOAD,
  CONTENT_TYPE_METRIC_V2,
  CONTENT_TYPE_PLOT_V2,
  CONTENT_TYPE_TABLE_V2,
} from 'util/narratives/constants'

const MarkdownContentContainer = styled.div`
  .styled-editor-box,
  .styled-preview-box {
    width: 50%;
  }
`

interface Props {
  compileContentRef: MutableRefObject<(() => void) | undefined>
  refreshInputOptionsRef: MutableRefObject<(() => void) | undefined>
}

const ModalContent = ({ compileContentRef, refreshInputOptionsRef }: Props) => {
  const {
    input: { value: contentType },
  } = useField('type', { subscription: { value: true } })

  return (
    <Box style={{ width: '100%', overflow: 'auto', minHeight: '400px' }}>
      {contentType === CONTENT_TYPE_MARKDOWN && (
        <MarkdownContentContainer>
          <MarkdownContent fieldName="data" />
        </MarkdownContentContainer>
      )}

      {contentType === CONTENT_TYPE_METRIC_V2 && (
        <MetricContent
          fieldName="data"
          compileContentRef={compileContentRef}
          setCompileDisabled={noop} // currently no compile button in dashboard edit
          refreshInputOptionsRef={refreshInputOptionsRef}
          showRecompileAndRefreshButtons
        />
      )}

      {contentType === CONTENT_TYPE_PLOT_V2 && (
        <PlotContent
          fieldName="data"
          compileContentRef={compileContentRef}
          setCompileDisabled={noop} // currently no compile button in dashboard edit
          refreshInputOptionsRef={refreshInputOptionsRef}
          isDashboard
          showRecompileAndRefreshButtons
        />
      )}

      {contentType === CONTENT_TYPE_TABLE_V2 && (
        <TableContent
          fieldName="data"
          compileContentRef={compileContentRef}
          setCompileDisabled={noop} // currently no compile button in dashboard edit
          refreshInputOptionsRef={refreshInputOptionsRef}
          showRecompileAndRefreshButtons
        />
      )}

      {contentType === CONTENT_TYPE_IMAGE_UPLOAD && <ImageUploaderContent fieldName="data" />}

      {contentType === CONTENT_TYPE_MEDIA_UPLOAD && <MediaUploader fieldName="data" />}
    </Box>
  )
}

export default ModalContent
