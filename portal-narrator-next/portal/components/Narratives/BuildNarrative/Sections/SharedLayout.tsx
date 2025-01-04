import { Box, BoxProps } from 'components/shared/jawns'
import React from 'react'
import styled, { css } from 'styled-components'
import { colors } from 'util/constants'

interface IEditorBoxProps extends BoxProps {
  newInput?: boolean
  relative?: boolean
}

interface IPreviewBoxProps extends BoxProps {
  minHeight?: number
  relative?: boolean
}

// Let's add a little indicator to the
// UI to let us know which content block
// we just added
const StyledEditorBox = styled(Box)<{ newInput?: boolean }>`
  position: relative;
  border-right: 1px solid ${colors.gray400};

  ${({ newInput }) =>
    newInput &&
    css`
      &::before {
        content: '';
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        border-right: 4px solid ${(props) => props.theme.colors.blue400};
      }
    `}
`

export const EditorBox: React.FC<IEditorBoxProps> = ({
  children,
  newInput,
  pt = 3,
  mb = 0,
  bg = 'white',
  relative = false,
  ...rest
}) => (
  <StyledEditorBox
    width={1 / 3}
    newInput={newInput}
    bg={bg}
    pt={pt}
    px={3}
    mb={mb}
    relative={relative}
    className="styled-editor-box"
    {...rest}
  >
    {children}
  </StyledEditorBox>
)

// The `mt` and `mb` values here are used to make the content
// boxes "stitch" together seamlessly in the Preview section of the
// Build Narrative page.
export const PreviewBox: React.FC<IPreviewBoxProps> = ({
  children,
  pl = 4,
  pr = 5,
  minHeight = 100,
  bg = 'white',
  relative = false,
  ...rest
}) => (
  <Box
    width={2 / 3}
    pl={pl}
    pr={pr}
    bg={bg}
    style={{
      minHeight,
    }}
    relative={relative}
    className="styled-preview-box"
    {...rest}
  >
    {children}
  </Box>
)
