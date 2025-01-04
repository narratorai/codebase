import { CopyOutlined, ShareAltOutlined, SyncOutlined } from '@ant-design/icons'
import { Alert, App, Button, Input, Popover, Tooltip } from 'antd-next'
import CopyToClipboard from 'components/shared/CopyToClipboard'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { toString } from 'lodash'
import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { colors } from 'util/constants'
import { MavisError } from 'util/useCallMavis'

interface Props {
  createLink: () => void
  loading: boolean
  error?: MavisError
  shareableLink?: string
  hoverText?: string
  helpText?: string
}

// force copy icon to take full addon space (clickability)
// remove focus/hover styles for input (read/highlight to copy only)
const StyledCopyInput = styled(Input)`
  .antd5-input-group-addon {
    padding: 0;

    &:hover {
      cursor: pointer;
      background-color: ${colors.gray200};
    }
  }

  .antd5-input:focus,
  .antd5-input:hover {
    box-shadow: none;
    border-color: #d9d9d9;
  }
`

const ShareCopyButton = ({
  createLink,
  shareableLink,
  loading,
  hoverText = 'Create a shareable link',
  helpText = 'Copy the link below to share',
}: Props) => {
  const { notification } = App.useApp()
  const [showCopy, setShowCopy] = useState(false)

  useEffect(() => {
    if (shareableLink) {
      setShowCopy(true)
    }
  }, [shareableLink])

  return (
    <Flex style={{ position: 'relative' }}>
      <Popover
        placement="left"
        open={!!shareableLink && !!showCopy}
        content={
          <Alert
            // key helps re-open the alert (if you create multiple links)
            // since this is closeable - this let's Alert know it's time to show again
            key={`${shareableLink}_show:${toString(showCopy)}`}
            closable
            onClose={() => setShowCopy(false)}
            message={
              <Box>
                <Typography mb={1}>{helpText}</Typography>
                <StyledCopyInput
                  value={shareableLink}
                  style={{ width: '320px', marginRight: '16px' }}
                  onClick={(event: any) => {
                    event.currentTarget.select()
                    event.currentTarget.readOnly = true
                  }}
                  addonAfter={
                    <CopyToClipboard
                      text={shareableLink || ''}
                      onCopy={() => {
                        notification.success({
                          message: 'Copied to Clipboard',
                          placement: 'topRight',
                          duration: 2,
                        })
                      }}
                    >
                      <Flex justifyContent="center" alignItems="center" style={{ height: '30px', width: '40px' }}>
                        <CopyOutlined />
                      </Flex>
                    </CopyToClipboard>
                  }
                />
              </Box>
            }
          />
        }
      >
        <Tooltip title={hoverText}>
          <Button
            size="small"
            shape="circle"
            type="dashed"
            onClick={createLink}
            icon={loading ? <SyncOutlined spin /> : <ShareAltOutlined />}
          />
        </Tooltip>
      </Popover>
    </Flex>
  )
}

export default ShareCopyButton
