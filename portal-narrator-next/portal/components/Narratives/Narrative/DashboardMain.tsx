import { useUser } from 'components/context/user/hooks'
import DashboardView from 'components/Narratives/Dashboards/AssembledDashboard/DashboardView'
import { Box } from 'components/shared/jawns'
import { INarrative } from 'graph/generated'

import AssembledNarrativeTopBar from './AssembledNarrativeTopBar'

interface Props {
  narrative: INarrative
  narrativeBySlug: any
  fileResponse: any
  toggleDynamicFieldDrawer: () => void
  handleRunNarrative: () => void
  refetchNarrative: () => void
}

export default function DashboardMain({
  narrative,
  narrativeBySlug,
  fileResponse,
  toggleDynamicFieldDrawer,
  handleRunNarrative,
  refetchNarrative,
}: Props) {
  const { user, isCompanyAdmin } = useUser()
  const notAllowedToUpdate = user.id !== narrative.created_by && !isCompanyAdmin

  return (
    <Box>
      <AssembledNarrativeTopBar
        narrative={narrative}
        notAllowedToUpdate={notAllowedToUpdate}
        toggleDynamicFieldDrawer={toggleDynamicFieldDrawer}
        handleRunNarrative={handleRunNarrative}
        refetchNarrative={refetchNarrative}
        isDashboard
      />

      {fileResponse?.narrative && <DashboardView narrativeConfig={narrativeBySlug?.narrative?.[0]} />}
    </Box>
  )
}
