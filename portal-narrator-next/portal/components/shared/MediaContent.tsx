import { Spin } from 'antd-next'
import { RcFile } from 'antd-next/es/upload/interface'
import { StyledImage } from 'components/Narratives/Dashboards/BuildDashboard/ContentItems/ImageContent'
import { useEffect, useState } from 'react'
import { getBase64 } from 'util/images/helpers'
import useCallMavis from 'util/useCallMavis'

interface MediaContentProps {
  isVideo?: boolean
  height?: number
  mediaSlug: string
  onSetUrl?: (url: string) => void
  filename: string
  imageAsBackground?: boolean
}

const MediaContent = ({ isVideo, height, mediaSlug, onSetUrl, filename, imageAsBackground }: MediaContentProps) => {
  const [url, setUrl] = useState<string | undefined>(undefined)

  const {
    response: getS3Response,
    loading: getMediaFromS3Loading,
    error: getMediaFromS3Error,
  } = useCallMavis<RcFile>({
    method: 'GET',
    path: `/v1/narrative/content/media/${mediaSlug}`,
    blobResponse: true,
  })

  useEffect(() => {
    if (getS3Response && !getMediaFromS3Loading && !getMediaFromS3Error) {
      // for images create data url
      if (!isVideo) {
        getBase64(getS3Response, (url) => {
          setUrl(url)
          onSetUrl?.(url)
        })
      }

      // for videos create object url
      if (isVideo) {
        const url = URL.createObjectURL(getS3Response)
        setUrl(URL.createObjectURL(getS3Response))
        onSetUrl?.(url)
      }
    }
  }, [getS3Response, getMediaFromS3Loading, getMediaFromS3Error, isVideo])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {!isVideo && (
        <ImageContent
          url={url}
          height={height}
          filename={filename}
          imageAsBackground={imageAsBackground}
          loading={getMediaFromS3Loading}
        />
      )}

      {isVideo && <VideoContent url={url} height={height} loading={getMediaFromS3Loading} />}
    </div>
  )
}

interface ImageContentProps {
  url?: string
  imageAsBackground?: boolean
  height?: number
  filename: string
  loading: boolean
}

const ImageContent = ({ url, imageAsBackground, height, filename, loading }: ImageContentProps) => {
  if (imageAsBackground && url) {
    // don't wrap StyledImage in Spin or it will break the background image
    return <StyledImage src={url} />
  }

  return (
    <Spin spinning={loading}>
      {url && <img src={url} style={{ height: height ? `${height}px` : '100%', maxWidth: '100%' }} alt={filename} />}
    </Spin>
  )
}

interface VideoContentProps {
  url?: string
  height?: number
  loading: boolean
}

const VideoContent = ({ url, height, loading }: VideoContentProps) => {
  return (
    <Spin spinning={loading}>
      <div style={{ height: height ? `${height}px` : '100%' }}>
        {/* Media elements such as <audio> and <video> must have a <track> for captions.
      We don't know what they will upload so don't have access to track  */}
        {/* eslint-disable-next-line */}
        {url && <video src={url} controls style={{ maxWidth: '100%', maxHeight: '100%' }} />}
      </div>
    </Spin>
  )
}

export default MediaContent
