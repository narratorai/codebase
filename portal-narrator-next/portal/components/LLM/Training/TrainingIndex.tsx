import { App, Spin } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { TrainingType } from 'components/LLM//Training/interfaces'
import { TRAINING_CONTENT_Z_INDEX, TRAINING_INDEX_TOP_BAR_HEIGHT } from 'components/LLM/Training/constants'
import DeleteTrainingModal from 'components/LLM/Training/DeleteTrainingModal'
import EditTraingingDrawer from 'components/LLM/Training/EditTrainingDrawer'
import TrainingIndexTable from 'components/LLM/Training/TrainingIndexTable'
import TrainingIndexTopBar from 'components/LLM/Training/TrainingIndexTopBar'
import { Box } from 'components/shared/jawns'
import { LayoutContent } from 'components/shared/layout/LayoutWithFixedSider'
import Page from 'components/shared/Page'
import { useTrainingIndexNeedsUpdatingSubscription, useTrainingsIndexQuery } from 'graph/generated'
import { filter, includes, isFinite } from 'lodash'
import { useEffect, useState } from 'react'
import { useHistory } from 'react-router'
import { useParams } from 'react-router-dom'
import usePrevious from 'util/usePrevious'

enum OverlayNames {
  TRAINING_OVERLAY_DELETE = 'delete',
}
interface OverlayProps {
  name: OverlayNames
  training?: TrainingType
}

const TrainingIndex = () => {
  const { notification } = App.useApp()
  const company = useCompany()
  const { isSuperAdmin } = useUser()
  const history = useHistory()
  const { id: editId } = useParams<{ id: string }>()

  const [overlay, setOverlay] = useState<OverlayProps | null>(null)

  const handleOpenEditDrawer = (id: string) => {
    history.push(`/${company.slug}/llms/trainings/edit/${id}`)
  }
  const handleCloseEditDrawer = () => {
    history.push(`/${company.slug}/llms/trainings`)
  }

  const {
    data: trainingsData,
    loading: trainingsLoading,
    error: trainingsError,
    refetch: refetchTrainings,
  } = useTrainingsIndexQuery({
    variables: { company_id: company.id },
  })

  // remove all @narrator.ai created trainings if not super admin
  const trainings = filter(trainingsData?.all_trainings, (training) => {
    return isSuperAdmin || !includes(training.user.email, '@narrator.ai')
  })

  // handle refetch trainings when they are updated/added/deleted
  const { data: trainingsNeedsUpdatingData } = useTrainingIndexNeedsUpdatingSubscription({
    variables: { company_id: company.id },
  })
  const lastTrainingUpdatedAt = trainingsNeedsUpdatingData?.all_trainings?.[0]?.updated_at
  const prevLastTrainingUpdatedAt = usePrevious(lastTrainingUpdatedAt)

  // refetch trainings when they are updated
  useEffect(() => {
    if (prevLastTrainingUpdatedAt && prevLastTrainingUpdatedAt !== lastTrainingUpdatedAt) {
      refetchTrainings()
    }
  }, [prevLastTrainingUpdatedAt, lastTrainingUpdatedAt, refetchTrainings])

  const allTrainingLength = trainingsNeedsUpdatingData?.all_trainings?.length
  const prevAllTrainingLength = usePrevious(allTrainingLength)

  // refetch trainings when they are added/deleted
  useEffect(() => {
    if (isFinite(prevAllTrainingLength) && isFinite(allTrainingLength) && prevAllTrainingLength !== allTrainingLength) {
      refetchTrainings()
    }
  }, [prevAllTrainingLength, allTrainingLength, refetchTrainings])

  // handle errors fetching trainings
  useEffect(() => {
    if (trainingsError) {
      notification.error({
        message: 'Error fetching trainings',
        description: trainingsError.message,
      })
    }
  }, [trainingsError, notification])

  const handleCloseOverlay = () => {
    setOverlay(null)
  }

  const handleOpenDeleteModal = (training: TrainingType) => {
    setOverlay({ name: OverlayNames.TRAINING_OVERLAY_DELETE, training })
  }

  return (
    <Page title="LLM Training | Narrator" hasSider={false} style={{ height: '100vh', overflowY: 'hidden' }}>
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
        <TrainingIndexTopBar />

        <Box
          style={{
            position: 'sticky',
            top: TRAINING_INDEX_TOP_BAR_HEIGHT,
            height: `calc(100vh - ${TRAINING_INDEX_TOP_BAR_HEIGHT}px)`,
            overflowY: 'auto',
            zIndex: TRAINING_CONTENT_Z_INDEX,
          }}
          pb="80px" // extra padding to escape Help Scout icon
        >
          <Spin spinning={trainingsLoading}>
            <TrainingIndexTable
              trainings={trainings}
              handleOpenDeleteModal={handleOpenDeleteModal}
              handleOpenEditDrawer={handleOpenEditDrawer}
            />
          </Spin>
        </Box>
      </LayoutContent>

      {/* Modals */}
      {/* DELETE MODAL */}
      {overlay?.name === OverlayNames.TRAINING_OVERLAY_DELETE && overlay?.training && (
        <DeleteTrainingModal
          id={overlay.training.id}
          question={overlay.training.question}
          onClose={handleCloseOverlay}
        />
      )}

      {/* EDIT DRAWER */}
      {editId && <EditTraingingDrawer id={editId} onClose={handleCloseEditDrawer} onSuccess={refetchTrainings} />}
    </Page>
  )
}

export default TrainingIndex
