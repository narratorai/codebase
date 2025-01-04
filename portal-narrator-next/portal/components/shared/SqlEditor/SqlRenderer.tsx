import { Box } from 'components/shared/jawns'
import React from 'react'
import styled from 'styled-components'
import Renderer from 'util/markdown/renderer'

export const StyledSql = styled(Box)`
  pre {
    border: none !important;
  }
`

interface SqlRendererProps {
  source?: string | null
}

const SqlRenderer: React.FC<SqlRendererProps> = ({ source = '' }) => {
  return (
    <StyledSql>
      <Renderer source={'```sql\n' + source + '\n```'} />
    </StyledSql>
  )
}

export default SqlRenderer
