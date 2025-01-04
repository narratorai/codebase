import { UploadOutlined } from '@ant-design/icons'
import { App, Button, Slider, Upload } from 'antd-next'
import { UploadChangeParam } from 'antd-next/es/upload'
import { RcFile, UploadFile, UploadProps } from 'antd-next/es/upload/interface'
import { FormItem } from 'components/antd/staged'
import * as SharedLayout from 'components/Narratives/BuildNarrative/Sections/SharedLayout'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { includes } from 'lodash'
import { useState } from 'react'
import { useField } from 'react-final-form'
import { getBase64 } from 'util/images/helpers'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/svg', 'image/svg+xml', 'image/webp']

const IMAGE_FIELDNAME = 'data.image'
const IMAGE_FILENAME_FIELDNAME = 'data.filename'
const HEIGHT_FIELDNAME = 'data.height'

// https://ant.design/components/upload#components-upload-demo-avatar
const beforeUpload = (file: RcFile, notification: any) => {
  const isAllowedImageType = includes(ALLOWED_IMAGE_TYPES, file.type)

  // if not allowed image type, show error
  // and stop upload
  if (!isAllowedImageType) {
    notification.error({
      key: 'image-type-upload-error',
      message: 'Image Upload Error',
      description: 'File is not an allowed image type',
    })

    return false
  }

  const fileSizeMb = file.size / 1024 / 1024
  const isUnder10Mb = fileSizeMb < 10

  // if file is over 10mb, show error
  // and stop upload
  if (!isUnder10Mb) {
    notification.error({
      key: 'image-size-upload-error',
      message: 'Image Upload Error',
      description: 'Image must smaller than 10MB!',
    })

    return false
  }

  // otherwise allow the upload
  return true
}

interface Props {
  fieldName: string
  // dashboards should take up the full height of their content
  // but narratives should have a set height
  allowHeight?: boolean
}

const ImageUploaderContent = ({ fieldName, allowHeight }: Props) => {
  const { notification } = App.useApp()
  const [loading, setLoading] = useState(false)

  const {
    input: { value: imageUrl, onChange: onChangeImageUrl },
  } = useField(`${fieldName}.${IMAGE_FIELDNAME}`, { subscription: { value: true } })

  const {
    input: { value: imageFilename, onChange: onChangeImageFilename },
  } = useField(`${fieldName}.${IMAGE_FILENAME_FIELDNAME}`, { subscription: { value: true } })

  const {
    input: { value: imageHeight, onChange: onChangeImageHeight },
  } = useField(`${fieldName}.${HEIGHT_FIELDNAME}`, { subscription: { value: true } })

  const handleChange: UploadProps['onChange'] = (info: UploadChangeParam<UploadFile>) => {
    if (info.file.status === 'uploading') {
      setLoading(true)
      return
    }

    // Once file is uploaded, convert to dataUrl
    if (info.file.status === 'done') {
      getBase64(info.file.originFileObj as RcFile, (url) => {
        setLoading(false)
        // set base64 image url
        onChangeImageUrl(url)

        // set filename
        onChangeImageFilename(info.file.name)

        // if allowHeight and height hasn't been set
        // set it to default
        if (allowHeight && !imageHeight) {
          onChangeImageHeight(400)
        }
      })
    }
  }

  const height = allowHeight ? imageHeight : 400

  return (
    <Flex>
      <SharedLayout.EditorBox>
        <Box my={3}>
          <Typography type="title400" mb={2}>
            Upload an image here
          </Typography>

          <Upload
            showUploadList={false}
            beforeUpload={(file) => beforeUpload(file, notification)}
            onChange={handleChange}
          >
            <Button loading={loading} icon={<UploadOutlined />}>
              {imageUrl ? 'Update' : 'Upload'} Image
            </Button>
          </Upload>

          <Typography mt={'4px'}>
            {imageFilename ? imageFilename : 'We support jpeg, png, svg, gif, and webp'}{' '}
          </Typography>

          {allowHeight && imageUrl && (
            <Box mt={2}>
              <FormItem label={`Image Height: ${imageHeight}px`} layout="vertical">
                <Slider
                  tooltip={{ formatter: (value) => `${value}px` }}
                  value={imageHeight}
                  onChange={onChangeImageHeight}
                  min={50}
                  max={1000}
                />
              </FormItem>
            </Box>
          )}
        </Box>
      </SharedLayout.EditorBox>

      <SharedLayout.PreviewBox>
        <Flex justifyContent="space-around">
          {imageUrl && <img src={imageUrl} style={{ height: `${height}px` }} alt="" />}
        </Flex>
      </SharedLayout.PreviewBox>
    </Flex>
  )
}

export default ImageUploaderContent
