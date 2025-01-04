import { App, Slider, Spin } from 'antd-next'
import { FormItem } from 'components/antd/staged'
import * as SharedLayout from 'components/Narratives/BuildNarrative/Sections/SharedLayout'
import { Box, Flex, Typography } from 'components/shared/jawns'
import MediaContent from 'components/shared/MediaContent'
import { useEffect, useState } from 'react'
import { useField } from 'react-final-form'
import { FORM_DATA_CONTENT_TYPE } from 'util/constants'
import { useLazyCallMavis } from 'util/useCallMavis'

import Uploader from '@/components/Uploader'

export const MEDIA_FILENAME_FIELDNAME = 'data.filename'
export const FILE_TYPE_FIELDNAME = 'data.file_type'
export const HEIGHT_FIELDNAME = 'data.height'
export const MEDIA_SLUG_FIELDNAME = 'data.media_slug'

interface Props {
  fieldName: string
  // dashboards should take up the full height of their content
  // but narratives should have a set height
  allowHeight?: boolean
}

const MediaUploader = ({ fieldName, allowHeight }: Props) => {
  const { notification } = App.useApp()
  const [loading] = useState(false)
  const [hasSrcUrl, setHasSrcUrl] = useState(false)
  const handleHasSetSrcUrl = () => setHasSrcUrl(true)
  const [noFileError, setNoFileError] = useState<Error | undefined>()

  const [uploadMediaToS3, { loading: uploadMediaLoading }] = useLazyCallMavis<{
    slug: string
  }>({
    method: 'POST',
    path: `/v1/narrative/content/media`,
    contentType: FORM_DATA_CONTENT_TYPE,
  })

  // handle no file error notification
  useEffect(() => {
    if (noFileError) {
      notification.error({
        placement: 'topRight',
        duration: null,
        message: noFileError?.message,
      })
    }
  }, [noFileError, notification])

  const {
    input: { value: mediaSlug, onChange: onChangeMediaSlug },
  } = useField(`${fieldName}.${MEDIA_SLUG_FIELDNAME}`, { subscription: { value: true } })

  const {
    input: { value: filename, onChange: onChangeFilename },
  } = useField(`${fieldName}.${MEDIA_FILENAME_FIELDNAME}`, { subscription: { value: true } })

  const {
    input: { value: fileType, onChange: onChangeFileType },
  } = useField(`${fieldName}.${FILE_TYPE_FIELDNAME}`, { subscription: { value: true } })

  const {
    input: { value: mediaHeight, onChange: onChangeMediaHeight },
  } = useField(`${fieldName}.${HEIGHT_FIELDNAME}`, { subscription: { value: true } })

  const height = allowHeight ? mediaHeight : 400
  const isVideo = fileType === 'video/mp4'

  const uploadToMavis = async (file?: File) => {
    // just in case the file upload failed for some reason
    if (!file) {
      return setNoFileError(new Error('File upload failed'))
    }

    const formData = new FormData()
    formData.append('file', file)

    const response = await uploadMediaToS3({
      body: formData,
    })

    onChangeMediaSlug(response?.slug)
    onChangeFilename(file.name)
    onChangeFileType(file.type)

    // if allowHeight and height hasn't been set
    // set it to default
    if (allowHeight && !mediaHeight) {
      onChangeMediaHeight(400)
    }
  }
  return (
    <Flex>
      <SharedLayout.EditorBox>
        <Box my={3}>
          <Typography type="title400" mb={2}>
            Upload Media
          </Typography>

          <Uploader onUpload={uploadToMavis} filename={filename} uploading={uploadMediaLoading} />

          {allowHeight && hasSrcUrl && (
            <Box mt={2}>
              <FormItem label={`${isVideo ? 'Video' : 'Image'} Height: ${mediaHeight}px`} layout="vertical">
                <Slider
                  tooltip={{ formatter: (value) => `${value}px` }}
                  value={mediaHeight}
                  onChange={onChangeMediaHeight}
                  min={50}
                  max={1000}
                />
              </FormItem>
            </Box>
          )}
        </Box>
      </SharedLayout.EditorBox>

      <SharedLayout.PreviewBox>
        <Spin spinning={uploadMediaLoading || loading}>
          <Flex justifyContent="space-around" style={{ overflow: 'hidden' }}>
            {mediaSlug && (
              <MediaContent
                key={mediaSlug} // unmount each time the mediaSlug changes to force correct path for load media hook
                mediaSlug={mediaSlug}
                isVideo={isVideo}
                height={height}
                onSetUrl={handleHasSetSrcUrl}
                filename={filename}
              />
            )}
          </Flex>
        </Spin>
      </SharedLayout.PreviewBox>
    </Flex>
  )
}

export default MediaUploader
