import { useUser } from 'components/context/user/hooks'
import DeleteNarrativeModal from 'components/Narratives/Modals/DeleteNarrativeModal'
import DuplicateNarrativeModal from 'components/Narratives/Modals/DuplicateNarrativeModal'
import EditNarrativeConfigModal from 'components/Narratives/Modals/EditNarrativeConfigModal'
import SaveNarrativeModal from 'components/Narratives/Modals/SaveNarrativeModal'
import SaveNarrativeTemplateModal from 'components/Narratives/Modals/SaveNarrativeTemplateModal'
import { useContext } from 'react'

import DashboardIndexContent from './DashboardIndexContext'
import { OverlayNames, OverlayProps } from './interfaces'

interface Props {
  overlay?: OverlayProps | null
}

const DashboardModals = ({ overlay }: Props) => {
  const { isCompanyAdmin } = useUser()
  const { handleCloseOverlay, setRefreshIndex } = useContext(DashboardIndexContent)

  // Only for super admins - can see/update narrative config
  if (overlay?.name === OverlayNames.OVERLAY_UPDATE_CONFIG) {
    return <EditNarrativeConfigModal narrative={overlay.dashboard} onClose={handleCloseOverlay} isDashboard />
  }

  // SaveNarrativeModal handles Edit
  if (overlay?.name === OverlayNames.OVERLAY_UPDATE) {
    return (
      <SaveNarrativeModal
        canArchive={isCompanyAdmin}
        onClose={handleCloseOverlay}
        narrative={overlay?.dashboard}
        setRefreshIndex={setRefreshIndex}
        isDashboard
      />
    )
  }

  // mostly confirmation overlay before delete
  if (overlay?.name === OverlayNames.OVERLAY_DELETE) {
    return <DeleteNarrativeModal onClose={handleCloseOverlay} narrative={overlay.dashboard} isDashboard />
  }

  // allows you to change the name before duping dashboard and its config
  if (overlay?.name === OverlayNames.OVERLAY_DUPLICATE) {
    return <DuplicateNarrativeModal narrative={overlay.dashboard} onClose={handleCloseOverlay} isDashboard />
  }

  // create a dashboard via templates
  if (overlay?.name === OverlayNames.OVERLAY_TEMPLATE_SAVE) {
    return <SaveNarrativeTemplateModal onClose={handleCloseOverlay} isDashboard />
  }

  // otherwise no overlay has been selected
  return null
}

export default DashboardModals
