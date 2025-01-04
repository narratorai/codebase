import { WarningOutlined } from '@ant-design/icons'
import { Alert } from 'antd-next'
import { Box, BoxProps, Typography } from 'components/shared/jawns'
import { ErrorInfo } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import styled from 'styled-components'
import { breakpoints, colors, semiBoldWeight } from 'util/constants'
import { reportError } from 'util/errors'
import Renderer from 'util/markdown/renderer'

import { getLogger } from '@/util/logger'
const logger = getLogger()

export const StyledMarkdown = styled(({ ...props }: BoxProps) => <Box {...props} />)`
  @media print {
    h1,
    h2,
    h3,
    h4,
    h5,
    p,
    img,
    li {
      break-inside: avoid-page;
    }
  }

  font-size: 1.1em;

  a {
    text-decoration: underline;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  li {
    margin-bottom: 8px;
    color: inherit;
  }

  h1,
  h2,
  h3 {
    font-weight: normal;
  }

  h1 {
    font-size: 1.6em;
  }

  h2 {
    font-size: 1.4em;
  }

  h3 {
    font-size: 1.2em;
  }

  ol,
  ul {
    padding-inline-start: 2rem;
    margin-block-end: 1em;
  }

  table {
    border-collapse: collapse;

    th,
    td {
      padding: 16px;
      border-bottom: 1px solid ${colors.gray300};
      font-size: 0.9em;
    }

    th {
      font-weight: 600;
    }
  }

  strong {
    font-weight: ${semiBoldWeight};
  }

  hr {
    border: 1px solid ${colors.gray300};
    margin-top: 64px;
    margin-bottom: 64px;
  }

  img {
    max-width: 100%;
  }

  code {
    color: ${(props) => props.theme.colors.magenta500};
    font-family: ${(props) => props.theme.fonts.sans};
  }

  blockquote {
    padding: ${({ theme }) => `${theme.space[2]}px`};
    background-color: ${({ theme }) => theme.colors.blue100};
    color: ${({ theme }) => theme.colors.blue700};
    border: 1px solid ${({ theme }) => theme.colors.blue200};

    p:last-of-type {
      margin-bottom: 0;
    }
  }

  aside {
    font-size: 1.2em;
    margin-top: 24px;
    margin-bottom: 24px;
    margin-left: -40px;
    color: ${({ theme }) => theme.colors.blue700};
    border-left: 2px solid ${({ theme }) => theme.colors.blue700};
    padding-left: 20px;
  }

  @media only screen and (max-width: ${breakpoints.md}) {
    h1 {
      font-size: 1.6em;
      margin-top: 32px;
    }

    h2 {
      font-size: 1.4em;
      margin-top: 24px;
    }

    aside {
      margin-left: 8px;
      font-size: 1.3em;
    }

    p {
      font-size: 1em;
    }
  }
`

// Fallback for markdown rendering errors, render content in a <pre/>
// If isEditorPreview is true, show a warning as well
const MarkdownErrorFallback = ({ source, isEditorPreview }: { source?: string | null; isEditorPreview?: boolean }) => {
  return (
    <div>
      <Typography as="pre" mb={1}>
        {source}
      </Typography>
      {isEditorPreview && (
        <Alert
          showIcon
          icon={<WarningOutlined title="warning" />}
          type="warning"
          message="Something went wrong displaying this content"
          description="Continue editing to try again"
        />
      )}
    </div>
  )
}

const reportMarkdownError = (err: Error, info: ErrorInfo) => {
  logger.error({ err }, 'Markdown rendering error')
  reportError(err, null, {
    boundary: 'markdown-renderer',
    componentStack: info.componentStack,
  })
}

interface MarkdownRendererProps {
  source?: string | null
  isEditorPreview?: boolean
}

const MarkdownRenderer = ({ source = '', isEditorPreview = false }: MarkdownRendererProps) => {
  return (
    <ErrorBoundary
      onError={reportMarkdownError}
      resetKeys={[source]}
      fallback={<MarkdownErrorFallback source={source} isEditorPreview={isEditorPreview} />}
    >
      <StyledMarkdown>
        <Renderer source={source} />
      </StyledMarkdown>
    </ErrorBoundary>
  )
}

export default MarkdownRenderer
