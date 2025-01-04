import { RedoOutlined } from '@ant-design/icons'
import { Button, Tooltip } from 'antd-next'
import ImageUploaderContent from 'components/Narratives/BuildNarrative/Sections/BasicContent/ImageUploaderContent'
import MetricContent from 'components/Narratives/BuildNarrative/Sections/BasicContent/MetricContent'
import PlotContent from 'components/Narratives/BuildNarrative/Sections/BasicContent/PlotContent'
import TableContent from 'components/Narratives/BuildNarrative/Sections/BasicContent/TableContent'
import ContentOptions from 'components/Narratives/BuildNarrative/Sections/ContentOptions'
import * as SharedLayout from 'components/Narratives/BuildNarrative/Sections/SharedLayout'
import { Flex } from 'components/shared/jawns'
import MediaUploader from 'components/shared/MediaUploader'
import { useRef, useState } from 'react'
import {
  CONTENT_TYPE_IMAGE_UPLOAD,
  CONTENT_TYPE_MEDIA_UPLOAD,
  CONTENT_TYPE_METRIC_V2,
  CONTENT_TYPE_PLOT_V2,
  CONTENT_TYPE_TABLE_V2,
} from 'util/narratives/constants'

interface Props {
  fieldName: string
  type:
    | typeof CONTENT_TYPE_METRIC_V2
    | typeof CONTENT_TYPE_PLOT_V2
    | typeof CONTENT_TYPE_TABLE_V2
    | typeof CONTENT_TYPE_IMAGE_UPLOAD
    | typeof CONTENT_TYPE_MEDIA_UPLOAD
  contentVisibleInAssembled: boolean
  handleToggleShowCondition: () => void
  index: number
  isLast: boolean
  sectionFieldName: string
  showCondition: boolean
  contentHidden: boolean
}

const BasicContent = ({
  fieldName,
  type,
  contentVisibleInAssembled,
  handleToggleShowCondition,
  index,
  isLast,
  sectionFieldName,
  showCondition,
  contentHidden,
}: Props) => {
  const [compileDisabled, setCompileDisabled] = useState(false)

  const refreshInputOptionsRef = useRef<() => void>()
  const compileContentRef = useRef<() => void>()

  const handleRefreshInputOptions = () => {
    if (refreshInputOptionsRef.current) {
      refreshInputOptionsRef.current()
    }
  }

  const handleCompileCallback = () => {
    if (compileContentRef.current) {
      compileContentRef.current()
    }
  }

  return (
    <div data-test="basic-content">
      <SharedLayout.EditorBox>
        <Flex justifyContent="space-between" alignItems="center">
          <Tooltip title="Refresh input options">
            <Button onClick={handleRefreshInputOptions} size="small" icon={<RedoOutlined />} />
          </Tooltip>

          <ContentOptions
            compileDisabled={compileDisabled}
            handleCompileCallback={handleCompileCallback}
            showCondition={showCondition}
            contentHidden={contentHidden}
            contentVisibleInAssembled={contentVisibleInAssembled}
            index={index}
            isLast={isLast}
            handleToggleShowCondition={handleToggleShowCondition}
            sectionFieldName={sectionFieldName}
          />
        </Flex>
      </SharedLayout.EditorBox>

      {type === CONTENT_TYPE_METRIC_V2 && (
        <MetricContent
          fieldName={fieldName}
          setCompileDisabled={setCompileDisabled}
          compileContentRef={compileContentRef}
          refreshInputOptionsRef={refreshInputOptionsRef}
        />
      )}

      {type === CONTENT_TYPE_PLOT_V2 && (
        <PlotContent
          fieldName={fieldName}
          compileContentRef={compileContentRef}
          setCompileDisabled={setCompileDisabled}
          refreshInputOptionsRef={refreshInputOptionsRef}
        />
      )}

      {type === CONTENT_TYPE_TABLE_V2 && (
        <TableContent
          fieldName={fieldName}
          compileContentRef={compileContentRef}
          setCompileDisabled={setCompileDisabled}
          refreshInputOptionsRef={refreshInputOptionsRef}
        />
      )}

      {type === CONTENT_TYPE_IMAGE_UPLOAD && <ImageUploaderContent fieldName={fieldName} allowHeight />}

      {type === CONTENT_TYPE_MEDIA_UPLOAD && <MediaUploader fieldName={fieldName} allowHeight />}
    </div>
  )
}

export default BasicContent
