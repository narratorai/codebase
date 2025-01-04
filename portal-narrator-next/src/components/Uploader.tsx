import { Spin } from 'antd-next'
import { Typography } from 'components/shared/jawns'
import { ChangeEvent } from 'react'
import { useState } from 'react'
import styled, { css } from 'styled-components'
import { colors } from 'util/constants'
import { makeShortid } from 'util/shortid'

// override default input file styles
// - hides "No file chosen" text - which is otherwise impossible to override
// - styles the button more like antd
const InputContainer = styled.div<{ uploadId: string }>`
  ${({ uploadId }) => css`
    #${uploadId} {
      display: none;
    }

    #${uploadId}-label {
      border: 1px solid ${colors.gray400};
      padding: 4px 15px;
      border-radius: 4px;

      &:hover {
        cursor: pointer;
        border: 1px solid ${colors.blue500};
        color: ${colors.blue500};
      }
    }
  `}
`

interface Props {
  filename?: string
  onUpload: (file?: File) => void
  uploading: boolean
}

export default function Uploader({ filename, onUpload, uploading }: Props) {
  // set unique id so it doesn't clash
  // with other uploaders on the same page
  const [uploadId] = useState(makeShortid())

  const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    onUpload(file)
  }

  return (
    <Spin spinning={uploading}>
      <InputContainer uploadId={uploadId}>
        <input id={uploadId} name={uploadId} onInput={handleUpload} type="file" />
        <label htmlFor={uploadId} id={`${uploadId}-label`}>
          {uploading ? 'Uploading' : 'Upload'} Media
        </label>

        <Typography mt={1}>{filename ? filename : 'We support jpeg, png, svg, gif, webp, and mp4'} </Typography>
      </InputContainer>
    </Spin>
  )
}
