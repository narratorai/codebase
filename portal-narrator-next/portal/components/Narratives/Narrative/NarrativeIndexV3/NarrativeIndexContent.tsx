import { Box } from 'components/shared/jawns'

import { NARRATIVE_CONTENT_Z_INDEX, NARRATIVE_HEADER_HEIGHT } from './constants'
import IndexTable from './IndexTable'

const NarrativeIndexContent = () => {
  return (
    <Box
      style={{
        position: 'sticky',
        top: NARRATIVE_HEADER_HEIGHT,
        height: `calc(100vh - ${NARRATIVE_HEADER_HEIGHT}px)`,
        overflowY: 'auto',
        zIndex: NARRATIVE_CONTENT_Z_INDEX,
        paddingBottom: '120px', // extra padding to escape the help scout
      }}
    >
      <IndexTable />
    </Box>
  )
}

export default NarrativeIndexContent
