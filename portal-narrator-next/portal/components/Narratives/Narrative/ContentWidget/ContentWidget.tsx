import DynamicContent from 'components/shared/Blocks/DynamicContent'
import MarkdownRenderer from 'components/shared/MarkdownRenderer'
import MediaContent from 'components/shared/MediaContent'
import {
  FILE_TYPE_FIELDNAME,
  HEIGHT_FIELDNAME,
  MEDIA_FILENAME_FIELDNAME,
  MEDIA_SLUG_FIELDNAME,
} from 'components/shared/MediaUploader'
import { get, includes } from 'lodash'
import { BlockContent } from 'util/blocks/interfaces'
import {
  CONTENT_TYPE_ANALYZE_SIMULATOR,
  CONTENT_TYPE_IMAGE_UPLOAD,
  CONTENT_TYPE_MARKDOWN,
  CONTENT_TYPE_MEDIA_UPLOAD,
  CONTENT_TYPE_RAW_METRIC,
} from 'util/narratives'

import NarrativeMarkdownStyle from '../../shared/NarrativeMarkdownStyle'
import AnalyzeSimulator from './AnalyzeSimulator'
import MetricGraphic from './MetricGraphic'

interface Props {
  config: {
    type: string
    value: any
    config?: any
    [key: string]: any
  }
}

const ContentWidget = ({ config }: Props) => {
  // New Block content has `value` as a key, whereas
  // the non-block ones don't. This is how we distinguish
  // between block vs non-block content types. It may be
  // better to add a new key to the config, like `is_block`
  // or something like that
  if (config?.value) {
    return <DynamicContent content={config as BlockContent} />
  }

  // new impact calculator
  if (config.type === CONTENT_TYPE_ANALYZE_SIMULATOR) {
    return <AnalyzeSimulator {...config.value} />
  }

  // image uploader
  if (config.type === CONTENT_TYPE_IMAGE_UPLOAD && config.data?.image) {
    const height = config.data?.height ? `${config.data.height}px` : '400px'

    return <img src={config.data.image} style={{ height }} alt="" />
  }

  // media uploader
  if (config.type === CONTENT_TYPE_MEDIA_UPLOAD) {
    const filename = get(config, MEDIA_FILENAME_FIELDNAME)
    const height = get(config, HEIGHT_FIELDNAME)
    const mediaSlug = get(config, MEDIA_SLUG_FIELDNAME)
    const fileType = get(config, FILE_TYPE_FIELDNAME)
    const isVideo = includes(fileType, 'video')

    return <MediaContent filename={filename} height={height} mediaSlug={mediaSlug} isVideo={isVideo} />
  }

  if (config.type === CONTENT_TYPE_MARKDOWN) {
    return (
      <NarrativeMarkdownStyle>
        <MarkdownRenderer source={config.text} />
      </NarrativeMarkdownStyle>
    )
  }

  if (config.type === CONTENT_TYPE_RAW_METRIC) {
    // Blocks return `config.value`
    return config?.value ? <MetricGraphic {...config.value} /> : <MetricGraphic {...config.metric_config} />
  }

  return null
}

export default ContentWidget
