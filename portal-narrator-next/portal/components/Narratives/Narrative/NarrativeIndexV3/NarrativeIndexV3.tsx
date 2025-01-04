import { Spin } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import DeleteNarrativeModal from 'components/Narratives/Modals/DeleteNarrativeModal'
import DuplicateNarrativeModal from 'components/Narratives/Modals/DuplicateNarrativeModal'
import EditNarrativeConfigModal from 'components/Narratives/Modals/EditNarrativeConfigModal'
import SaveNarrativeModal from 'components/Narratives/Modals/SaveNarrativeModal'
import SaveNarrativeTemplateModal from 'components/Narratives/Modals/SaveNarrativeTemplateModal'
import { getSharedCompanyTags } from 'components/shared/IndexPages/helpers'
import { LayoutContent } from 'components/shared/layout/LayoutWithFixedSider'
import Page from 'components/shared/Page'
import { IStatus_Enum, useListCompanyTagsQuery, useListNarrativesV3Query } from 'graph/generated'
import { useState } from 'react'

import { sortNarratives } from './helpers'
import { NarrativeType } from './interfaces'
import NarrativeIndexContent from './NarrativeIndexContent'
import NarrativeIndexContext from './NarrativeIndexContext'
import NarrativeIndexHeader from './NarrativeIndexHeader'

enum OverlayNames {
  NARRATIVE_OVERLAY_TEMPLATE_SAVE = 'save_template',
  NARRATIVE_OVERLAY_UPDATE = 'update',
  NARRATIVE_OVERLAY_DUPLICATE = 'duplicate',
  NARRATIVE_OVERLAY_UPDATE_CONFIG = 'config',
  NARRATIVE_OVERLAY_DELETE = 'delete',
}

interface OverlayProps {
  name: OverlayNames
  narrative?: NarrativeType
}

const DEFAULT_ALLOWED_STATES = [IStatus_Enum.InProgress, IStatus_Enum.Live]

const NarrativeIndexV3 = () => {
  const company = useCompany()
  const { user, isCompanyAdmin } = useUser()

  const [overlay, setOverlay] = useState<OverlayProps | null>(null)

  const handleCloseOverlay = () => {
    setOverlay(null)
  }

  const handleOpenSaveTemplateOverlay = () => {
    setOverlay({ name: OverlayNames.NARRATIVE_OVERLAY_TEMPLATE_SAVE })
  }

  const handleOpenUpdateOverlay = (narrative: NarrativeType) => {
    setOverlay({ name: OverlayNames.NARRATIVE_OVERLAY_UPDATE, narrative })
  }

  const handleOpenDeleteOverlay = (narrative: NarrativeType) => {
    setOverlay({ name: OverlayNames.NARRATIVE_OVERLAY_DELETE, narrative })
  }

  const handleOpenConfigOverlay = (narrative: NarrativeType) => {
    setOverlay({ name: OverlayNames.NARRATIVE_OVERLAY_UPDATE_CONFIG, narrative })
  }

  const handleOpenDuplicateOverlay = (narrative: NarrativeType) => {
    setOverlay({ name: OverlayNames.NARRATIVE_OVERLAY_DUPLICATE, narrative })
  }

  const { data: tagsResult, loading: tagsLoading } = useListCompanyTagsQuery({
    variables: { company_id: company?.id, user_id: user.id },
    fetchPolicy: 'cache-and-network',
  })
  const tags = tagsResult?.company_tags || []
  const sharedTags = getSharedCompanyTags(tags)

  // Get Narratives
  const {
    data: narrativesData,
    loading: narrativesLoading,
    // error: narrativesError,
    refetch: refetchNarratives,
  } = useListNarrativesV3Query({
    variables: { company_id: company.id, statuses: DEFAULT_ALLOWED_STATES, user_id: user.id },
    notifyOnNetworkStatusChange: true,
    // This makes sure data reloads every time
    // the page loads (solves create/delete inconsistencies)
    fetchPolicy: 'cache-and-network',
  })

  const allNarratives = narrativesData?.narrative

  // Narratives are initially sorted by:
  // 1. Favorited
  // 2. Recently Viewed or Created At (whichever is first)
  const sortedNarratives = sortNarratives(allNarratives)

  // co-opting the refresh logic used in old index page/save overlay
  const handleSetRefreshIndex = (shouldRefresh: boolean) => {
    if (shouldRefresh) {
      refetchNarratives()
    }
  }

  return (
    <Page
      title="Analyses"
      mobileFriendly
      breadcrumbs={[{ text: 'Analyses' }]}
      style={{ height: '100vh', overflowY: 'hidden' }}
    >
      <NarrativeIndexContext.Provider
        value={{
          narratives: sortedNarratives,
          narrativesLoading,
          handleOpenSaveTemplateOverlay,
          handleOpenUpdateOverlay,
          handleOpenDeleteOverlay,
          handleOpenConfigOverlay,
          handleOpenDuplicateOverlay,
          handleCloseOverlay,
          sharedTags,
          tagsLoading,
          refetchNarratives,
        }}
      >
        <LayoutContent
          siderWidth={0}
          style={{
            width: '100%',
            marginLeft: 0,
            height: '100%',
            overflowY: 'hidden',
            padding: '32px',
            paddingTop: '16px',
          }}
        >
          <NarrativeIndexHeader />

          <Spin spinning={narrativesLoading}>
            <NarrativeIndexContent />
          </Spin>
        </LayoutContent>

        {/* Only for super admins - can see/update narrative config */}
        {overlay?.name === OverlayNames.NARRATIVE_OVERLAY_UPDATE_CONFIG && (
          <EditNarrativeConfigModal narrative={overlay.narrative} onClose={handleCloseOverlay} />
        )}

        {/* SaveNarrativeModal handles New and Edit */}
        {overlay?.name === OverlayNames.NARRATIVE_OVERLAY_UPDATE && (
          <SaveNarrativeModal
            canArchive={isCompanyAdmin}
            onClose={handleCloseOverlay}
            narrative={overlay?.narrative}
            setRefreshIndex={handleSetRefreshIndex}
          />
        )}

        {overlay?.name === OverlayNames.NARRATIVE_OVERLAY_TEMPLATE_SAVE && (
          <SaveNarrativeTemplateModal onClose={handleCloseOverlay} />
        )}

        {/* mostly confirmation overlay before delete */}
        {overlay?.name === OverlayNames.NARRATIVE_OVERLAY_DELETE && (
          <DeleteNarrativeModal
            onClose={handleCloseOverlay}
            narrative={overlay.narrative}
            onSuccess={refetchNarratives}
          />
        )}

        {/* allows you to change the name before duping narrative and its config */}
        {overlay?.name === OverlayNames.NARRATIVE_OVERLAY_DUPLICATE && (
          <DuplicateNarrativeModal narrative={overlay.narrative} onClose={handleCloseOverlay} />
        )}
      </NarrativeIndexContext.Provider>
    </Page>
  )
}

export default NarrativeIndexV3
