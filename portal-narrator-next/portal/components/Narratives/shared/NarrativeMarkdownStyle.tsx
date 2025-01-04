import { Box } from 'components/shared/jawns'
import styled from 'styled-components'
import { COPY_MAXWIDTH } from 'util/analyses/constants'

// This overrides the default Markdown styles
// for Narratives
const NarrativeMarkdownStyle = styled(Box)`
  h1 {
    margin-top: 32px;
    margin-bottom: 24px;
  }

  h2 {
    margin-top: 32px;
    margin-bottom: 24px;
  }

  h3 {
    margin-top: 32px;
    margin-bottom: 16px;
  }

  p {
    font-size: 1.1em;
  }

  blockquote {
    margin-top: 32px;
    margin-bottom: 32px;
  }

  margin-left: auto;
  margin-right: auto;
  max-width: ${COPY_MAXWIDTH};

  @media print {
    max-width: 900px;
  }
`

export default NarrativeMarkdownStyle
