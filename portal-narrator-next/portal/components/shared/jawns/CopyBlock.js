import React from 'react'
import styled from 'styled-components'
import CopyToClipboard from 'components/shared/CopyToClipboard'

import Box from './Box'
import Button from './Button'
import Flex from './Flex'
import Typography from './Typography'

const CopyBlockWrapper = styled(Flex)`
  margin-bottom: 8px;
  border-radius: 4px;
  padding: 8px;
  border: 1px solid ${(props) => props.theme.colors.blue700};
  position: relative;

  p {
    font-family: monospace;
    white-space: pre-wrap;
    word-break: break-word;
  }
`

const CopyBlock = ({ children }) => (
  <CopyBlockWrapper alignItems="center">
    <Box flexGrow={1} pr="4px">
      <Typography type="body100" color="blurple400">
        {children}
      </Typography>
    </Box>

    <Box width="60px">
      <CopyToClipboard text={children}>
        <Button bg="blurple400" bgHover="blurple500" bgActive="blurple600" tiny>
          Copy Text
        </Button>
      </CopyToClipboard>
    </Box>
  </CopyBlockWrapper>
)

export default CopyBlock
