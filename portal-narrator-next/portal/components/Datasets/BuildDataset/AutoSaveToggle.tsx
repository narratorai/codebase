import { App, Spin, Switch, Tooltip } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { useUpdateDataset } from 'components/Datasets/hooks'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { IStatus_Enum } from 'graph/generated'
import { makeQueryDefinitionFromContext } from 'machines/datasets'
import { useContext, useEffect, useMemo } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { colors } from 'util/constants'
import { DatasetContext, IDatasetFormContext } from 'util/datasets/interfaces'
import { timeFromNow } from 'util/helpers'
import { handleMavisErrorNotification, MavisError } from 'util/useCallMavis'
import usePrevious from 'util/usePrevious'
import useToggle from 'util/useToggle'

import DatasetFormContext from './DatasetFormContext'

const AutoSaveToggle = () => {
  const [shouldAutoSave, toggleShouldAutoSave] = useToggle(false)
  const company = useCompany()
  const { user, isCompanyAdmin } = useUser()
  const { machineCurrent, dataset } = useContext<IDatasetFormContext>(DatasetFormContext) || {}
  const { notification } = App.useApp()

  // pending run tells us if we submitted definition, but hasn't started running yet
  const pendingRun = machineCurrent?.context?._pending_run
  const datasetIsRunning = machineCurrent?.context?._is_running
  const prevDatasetIsRunning = usePrevious(datasetIsRunning)

  // for is new: check if dataset exists in graph (not just slug in url)
  // we auto-generate datasets that don't yet exist in graph
  const isNewDataset = !dataset?.slug
  const saveIsStale = machineCurrent?.context?._is_dirty
  const lastSaved = timeFromNow(dataset?.updated_at, company?.timezone)

  const notYourDataset = user.id !== dataset?.created_by && !isCompanyAdmin
  const notAllowedToUpdate = isNewDataset || notYourDataset || dataset?.locked

  const tooltipTitle = useMemo(() => {
    if (isNewDataset) {
      return 'Please save this dataset before using autosave mode.'
    }

    if (notYourDataset) {
      return 'Not your dataset. Please duplicate to make edits.'
    }

    if (dataset?.locked) {
      return 'Dataset is locked. Unlock dataset to save.'
    }

    return undefined
  }, [isNewDataset, notYourDataset, dataset?.locked])

  const handleAutoSaveError = (error: MavisError) => {
    handleMavisErrorNotification({ error, notification })
  }

  const [updateDataset, { loading: datasetUpdating }] = useUpdateDataset({
    isCreating: false,
    onError: handleAutoSaveError,
    silenceUpdateSuccess: true,
  })

  const handleUpdate = ({ dataset, machineContext }: { dataset: any; machineContext: DatasetContext }) => {
    updateDataset({
      queryDefinition: makeQueryDefinitionFromContext(machineContext),
      ...dataset,
    })
  }
  const debouncedHandleUpdate = useDebouncedCallback(handleUpdate, 5000)

  // When to fire Auto Save
  useEffect(() => {
    if (shouldAutoSave && !notAllowedToUpdate && !pendingRun) {
      // fire the autosave event when the dataset is stale
      if (saveIsStale) {
        debouncedHandleUpdate({ dataset, machineContext: machineCurrent.context })
      }

      // fire the autosave event when the dataset finished running
      if (prevDatasetIsRunning && !datasetIsRunning) {
        debouncedHandleUpdate({ dataset, machineContext: machineCurrent.context })
      }
    }
  }, [
    shouldAutoSave,
    saveIsStale,
    debouncedHandleUpdate,
    dataset,
    machineCurrent.context,
    pendingRun,
    notAllowedToUpdate,
    prevDatasetIsRunning,
    datasetIsRunning,
  ])

  const handleToggleShouldAutoSave = () => {
    toggleShouldAutoSave()

    // warn the user if they are going into auto save mode
    // and the dataset is shared
    // that it could over-write other users' work
    if (!shouldAutoSave && dataset?.status === IStatus_Enum.Live) {
      notification.warning({
        key: 'auto-save-warning',
        message: 'Warning: This dataset is Shared',
        description: "Auto Save will overwrite other users' unsaved changes",
      })
    }
  }

  return (
    <Spin spinning={datasetUpdating}>
      <Flex justifyContent="space-between" alignItems="center" mt={1}>
        <Box>
          {saveIsStale ? <Typography color={colors.red600}>Unsaved Changes</Typography> : `Last saved ${lastSaved}`}
        </Box>
        <Box>
          {' '}
          <Tooltip title={tooltipTitle}>
            <Switch
              checked={shouldAutoSave}
              checkedChildren="Auto Save"
              unCheckedChildren="Auto Save"
              onChange={handleToggleShouldAutoSave}
              disabled={notAllowedToUpdate}
            />
          </Tooltip>
        </Box>
      </Flex>
    </Spin>
  )
}

export default AutoSaveToggle
