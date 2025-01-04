import DatasetIntegrationsModal from 'components/Datasets/Modals/DatasetIntegrationsModal'
import DatasetStoryDrawer from 'components/Datasets/Modals/DatasetStory/DatasetStoryDrawer'
import DeleteDatasetModal from 'components/Datasets/Modals/DeleteDatasetModal'
import DuplicateDatasetModal from 'components/Datasets/Modals/DuplicateDatasetModal'
import SaveDatasetModal from 'components/Datasets/Modals/SaveDatasetModal'
import { IDataset } from 'graph/generated'
import { makeQueryDefinitionFromContext } from 'machines/datasets'
import { useCallback, useContext, useEffect } from 'react'
import {
  TOOL_COPY_FROM_NARRATIVE_DATASET,
  TOOL_DELETE_DATASET,
  TOOL_DUPLICATE_DATASET,
  TOOL_GROUP_PARENT_FILTER,
  TOOL_ORDER_BY,
  TOOL_SAVE_DATASET,
} from 'util/datasets'
import { DatasetColumnType, IDatasetFormContext, IStory, viewTypeConstants } from 'util/datasets/interfaces'

import CopyFromNarrativeDatasetModal from '../CopyFromNarrativeDatasetModal'
import DatasetFormContext from '../DatasetFormContext'
import ComputedModal from './ComputedModal/ComputedModal'
import DeleteGroupModal from './DeleteGroup/DeleteGroupModal'
import EditPlotModal from './EditPlot/EditPlotModal'
import FilterPopover from './FilterPopover/FilterPopover'
import GroupParentFilterOverlay from './GroupParentFilter/GroupParentFilterModal'
import OrderByModal from './OrderBy/OrderByModal'
import PivotColumnModal from './PivotColumn/PivotColumnModal'
import QuickReorderColumnsModal from './QuickReorderColumns/QuickReorderColumnsModal'
import RenameGroupModal from './RenameGroup/RenameGroupModal'
import SpendConfigModal from './SpendConfig/SpendConfigModal'
import SwapColumnModal from './SwapColumn/SwapColumnModal'

interface Props {
  handleCloseToolOverlay: (...args: any[]) => any
  toolOverlay: string | null
  toolOverlayProps: {
    columnDefinition?: DatasetColumnType
    initialValues?: any
  }
}

const ToolModal = ({ handleCloseToolOverlay, toolOverlay, toolOverlayProps }: Props) => {
  const { machineCurrent, machineSend } = useContext<IDatasetFormContext>(DatasetFormContext)
  const dataset = machineCurrent.context._dataset_from_graph as IDataset
  const queryDefinition = makeQueryDefinitionFromContext(machineCurrent.context)

  const showQuickReorderColumnsModal = machineCurrent.matches({ edit: 'quick_reorder_columns' })
  const showComputedModal = machineCurrent.matches({ edit: 'computation' })
  const showColumnFilterModal = machineCurrent.matches({ edit: 'filter_column' })
  const showIntegrationsModal = machineCurrent.matches({ edit: 'integrations' })
  const showEditSpend = machineCurrent.matches({ edit: 'create_spend' })

  // This gets fired only on create (new):
  const onCreateSuccess = () => {
    // close modal
    handleCloseToolOverlay()
  }

  // This gets fired only on a successful update! (not on new):
  const onUpdateSuccess = () => {
    // close modal
    handleCloseToolOverlay()
  }

  const handleCloseDatasetStory = useCallback(
    ({ story }: { story: IStory }) => {
      // save story to machine state when closing
      machineSend('EDIT_DATASET_STORY_CANCEL', { story })
    },
    [machineSend]
  )

  const handleDatasetStoryOnChange = useCallback(
    ({ story }: { story: IStory }) => {
      // save story to machine state when form is updated
      machineSend('UPDATE_DATASET_STORY', { story })
    },
    [machineSend]
  )

  // if view is "story", but machine isn't in edit: 'dataset_story' (came from query param)
  // update machine to be ready for story mode
  const showStoryOverlay = machineCurrent.context._view === viewTypeConstants.STORY && !!dataset?.slug

  const machineIsEditDatasetStory = machineCurrent.matches({ edit: 'dataset_story' })
  useEffect(() => {
    if (dataset && showStoryOverlay && !machineIsEditDatasetStory) {
      machineSend('EDIT_DATASET_STORY')
    }
  }, [showStoryOverlay, machineIsEditDatasetStory, machineSend, dataset])

  return (
    <>
      {/* UPDATED OVERLAYS TO USE MACHINE */}
      <DeleteGroupModal />
      <RenameGroupModal />
      <SwapColumnModal />
      <PivotColumnModal />
      <EditPlotModal />

      {showEditSpend && <SpendConfigModal />}

      {showComputedModal && <ComputedModal />}
      {showColumnFilterModal && <FilterPopover />}

      {/*
        OVERLAYS THAT NEED TO BE MOVED OVER TO MACHINE
        use _edit_context in the machine instead of toolOverlayProps!
      */}

      {toolOverlay === TOOL_DELETE_DATASET && (
        <DeleteDatasetModal dataset={dataset} onClose={handleCloseToolOverlay} to="/datasets" />
      )}

      {toolOverlay === TOOL_DUPLICATE_DATASET && (
        <DuplicateDatasetModal dataset={dataset} onClose={handleCloseToolOverlay} />
      )}

      {toolOverlay === TOOL_ORDER_BY && <OrderByModal onClose={handleCloseToolOverlay} />}
      {toolOverlay === TOOL_GROUP_PARENT_FILTER && (
        <GroupParentFilterOverlay onClose={handleCloseToolOverlay} {...toolOverlayProps} />
      )}

      {toolOverlay === TOOL_SAVE_DATASET && (
        <SaveDatasetModal
          dataset={dataset}
          onClose={handleCloseToolOverlay}
          onCreateSuccess={onCreateSuccess}
          onUpdateSuccess={onUpdateSuccess}
          queryDefinition={queryDefinition}
        />
      )}

      {toolOverlay === TOOL_COPY_FROM_NARRATIVE_DATASET && (
        <CopyFromNarrativeDatasetModal
          dataset={dataset}
          onClose={handleCloseToolOverlay}
          queryDefinition={queryDefinition}
        />
      )}

      {showQuickReorderColumnsModal && <QuickReorderColumnsModal />}
      {showIntegrationsModal && <DatasetIntegrationsModal queryDefinition={queryDefinition} />}

      {showStoryOverlay && (
        <DatasetStoryDrawer
          datasetSlug={dataset.slug}
          onClose={handleCloseDatasetStory}
          queryDefinition={queryDefinition}
          onFormChange={handleDatasetStoryOnChange}
          isEditDataset
        />
      )}
    </>
  )
}

export default ToolModal
