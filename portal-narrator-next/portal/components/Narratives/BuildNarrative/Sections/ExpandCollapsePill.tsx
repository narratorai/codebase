import { Badge } from 'antd-next'
import { Flex, Typography } from 'components/shared/jawns'
import pluralize from 'pluralize'
import React from 'react'
import styled from 'styled-components'

const ExpandCollapseContentsPillContainer = styled(Flex)<{ showContent: boolean }>`
  justify-content: center;
  align-items: center;
  position: relative;

  &:hover {
    ${({ showContent }) => `
      cursor: ${showContent ? 'zoom-out' : 'zoom-in'};
    `}
  }
`

const ExpandCollapseContentsPill = styled(Flex)`
  position: absolute;
  border: 1px solid black;
  background-color: white;
  border-radius: 8px;
  padding: 2px 8px;
  top: -42px;
`

const StyledBadge = styled(Badge)<{ shouldshow: boolean }>`
  .antd5-scroll-number antd5-badge-count {
    ${({ shouldshow }) => `
    display: ${shouldshow ? 'inherit' : 'none'};
  `}
  }

  .antd5-badge-count {
    right: -12px;
  }
`

interface Props {
  contentsLength: number
  toggleShowContent: () => void
  showContent: boolean
  totalSectionCompileErrors: number
}

const ExpandCollapsePill = ({ contentsLength, toggleShowContent, showContent, totalSectionCompileErrors }: Props) => {
  return (
    <ExpandCollapseContentsPillContainer data-public showContent={showContent}>
      <ExpandCollapseContentsPill>
        <StyledBadge count={totalSectionCompileErrors} shouldshow={!!totalSectionCompileErrors}>
          <Typography type="body200" as="span" onClick={toggleShowContent}>
            {showContent
              ? 'Collapse Contents'
              : `Expand ${contentsLength} Content ${pluralize('Block', contentsLength)}`}
          </Typography>
        </StyledBadge>
      </ExpandCollapseContentsPill>
    </ExpandCollapseContentsPillContainer>
  )
}

export default ExpandCollapsePill
