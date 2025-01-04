import { App, Spin } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { useUpdateDataset } from 'components/Datasets/hooks'
import { makeQueryDefinitionFromContext } from 'machines/datasets'
import React, { useCallback, useContext, useEffect } from 'react'
import { useHistory } from 'react-router'
import { TOOL_SAVE_DATASET } from 'util/datasets'

import CameFromNarrativeDescription from './CameFromNarrativeDescription'
import DatasetFormContext from './DatasetFormContext'
import DatasetLockedDescription from './DatasetLockedDescription'

const QuickSaveListener = () => {
  const company = useCompany()
  const history = useHistory()
  const { user, isCompanyAdmin } = useUser()
  const { notification } = App.useApp()

  const { machineSend, machineCurrent, onOpenToolOverlay, dataset, datasetSlug } = useContext(DatasetFormContext) || {}

  // for is new: check if dataset exists in graph (not just slug in url)
  // we auto-generate datasets that don't yet exist in graph
  const isNewDataset = !dataset?.slug

  const notAllowedToUpdate = !isNewDataset && user.id !== dataset?.created_by && !isCompanyAdmin
  const isEditDefinitionMode = machineCurrent.matches({ edit: 'definition' })

  const fromNarrative = machineCurrent.context._from_narrative
  const cameFromNarrative = !!fromNarrative?.upload_key && !!fromNarrative?.slug

  const onSaveError = (error: any) => {
    machineSend('SAVE_FAILURE', { error })
  }

  const handleOnCreateSuccess = (slug?: string) => {
    if (slug) {
      history.push(`/${company.slug}/datasets/edit/${slug}`)
    }
  }

  const [updateDataset, { loading: savingDataset }] = useUpdateDataset({
    isCreating: isNewDataset,
    onError: onSaveError,
    onCreateSuccess: handleOnCreateSuccess,
  })

  // show loading state when saving
  useEffect(() => {
    const notificationKey = `saving_${datasetSlug}`

    if (savingDataset) {
      notification.info({
        key: notificationKey,
        message: 'Saving Dataset',
        description: <Spin />,
      })
    } else {
      notification.destroy(notificationKey)
    }
  }, [savingDataset, datasetSlug])

  const handleQuickSaveSubmit = useCallback(
    (event: any) => {
      // handle (cmd + s) hotkey
      if ((event.ctrlKey || event.metaKey) && event.keyCode == 83) {
        // stop browser from saving the file
        event.preventDefault()

        // silence attempts to quick save when in edit definition mode
        if (isEditDefinitionMode) {
          return
        }

        if (cameFromNarrative) {
          return notification.warning({
            key: 'came-from-narrative',
            message: 'Save is Blocked',
            description: <CameFromNarrativeDescription />,
            duration: null,
          })
        }

        if (notAllowedToUpdate) {
          return notification.warning({
            key: 'not-your-dataset-cant-save',
            message: 'Not your Dataset',
            description: 'Please duplicate to make edits',
          })
        }

        if (dataset?.locked) {
          return notification.warning({
            key: 'dataset-locked-cant-save',
            message: 'Dataset Locked',
            duration: null,
            description: <DatasetLockedDescription />,
          })
        }

        // When new/creating - open the save overlay:
        if (isNewDataset) {
          return onOpenToolOverlay({ toolType: TOOL_SAVE_DATASET })
        }

        // When editing, just save the dataset without opening the overlay:
        updateDataset({
          queryDefinition: makeQueryDefinitionFromContext(machineCurrent.context),
          ...dataset,
        })
      }
    },
    [isEditDefinitionMode, notAllowedToUpdate, cameFromNarrative, isNewDataset, machineCurrent, dataset, updateDataset]
  )

  useEffect(() => {
    // add listener for cmd + s
    document.addEventListener('keydown', handleQuickSaveSubmit)

    return () => {
      // remove listener for cmd + s
      document.removeEventListener('keydown', handleQuickSaveSubmit)
    }
  }, [handleQuickSaveSubmit])

  // just a listener, no UI
  return null
}

export default QuickSaveListener
