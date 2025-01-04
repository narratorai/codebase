import CopyContentIcon from 'components/shared/CopyContentIcon'
import MarkdownRenderer from 'components/shared/MarkdownRenderer'
import React from 'react'
import styled from 'styled-components'
import { CopiedTableContent } from 'util/shared_content/interfaces'

const MarkdownTableContainer = styled.div`
  position: relative;
  max-width: 100%;
  height: 100%;
  overflow-y: auto;

  .copy-table-content-icon {
    position: absolute;
    opacity: 0;
    transition: opacity 150ms ease-in-out;
    top: 0;
    right: 0;
  }

  &:hover {
    .copy-table-content-icon {
      opacity: 1;
    }
  }
`

interface Props {
  copyContentValues?: CopiedTableContent
  source?: string | null
}

const MarkdownTableRenderer: React.FC<Props> = ({ source = '', copyContentValues, ...rest }) => {
  return (
    <MarkdownTableContainer style={{ maxWidth: '100%', height: '100%', overflowY: 'auto' }}>
      {copyContentValues && (
        <div className="copy-table-content-icon">
          <CopyContentIcon content={copyContentValues} />
        </div>
      )}
      <MarkdownRenderer source={source} {...rest} />
    </MarkdownTableContainer>
  )
}

export default MarkdownTableRenderer
