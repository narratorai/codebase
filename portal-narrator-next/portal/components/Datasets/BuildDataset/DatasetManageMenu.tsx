import {
  BlockOutlined,
  CaretRightOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditFilled,
  ExportOutlined,
  LockOutlined,
  MoreOutlined,
  SaveOutlined,
  ShareAltOutlined,
} from '@ant-design/icons'
import { App, Button, Dropdown, Space, Tooltip } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { useUpdateDataset } from 'components/Datasets/hooks'
import copy from 'copy-to-clipboard'
import { get } from 'lodash'
import { makeQueryDefinitionFromContext } from 'machines/datasets'
import React, { useContext } from 'react'
import { useHistory } from 'react-router'
import { colors } from 'util/constants'
import { TOOL_COPY_FROM_NARRATIVE_DATASET, TOOL_DELETE_DATASET, TOOL_SAVE_DATASET } from 'util/datasets'
import { IRequestApiData } from 'util/datasets/interfaces'

import CameFromNarrativeDescription from './CameFromNarrativeDescription'
import DatasetFormContext from './DatasetFormContext'
import DatasetLockedDescription from './DatasetLockedDescription'
import { ACTION_TYPE_QUERY } from './datasetReducer'

interface Props {
  onRunAllTabs: (runOptions?: Record<string, unknown>) => void
}

const DatasetManageMenu = ({ onRunAllTabs }: Props) => {
  const company = useCompany()
  const history = useHistory()
  const { notification } = App.useApp()

  const {
    machineSend,
    machineCurrent,
    onOpenToolOverlay,
    selectedApiData,
    handleToggleShowJson,
    handleToggleSensitiveInfo,
    dataset,
    handleOpenIntegrationOverlay,
  } = useContext(DatasetFormContext) || {}
  const fromNarrative = machineCurrent.context._from_narrative
  const cameFromNarrative = !!fromNarrative?.upload_key && !!fromNarrative?.slug

  // for is new: check if dataset exists in graph (not just slug in url)
  // we auto-generate datasets that don't yet exist in graph
  const isNewDataset = !dataset?.slug

  const editingDefinition = machineCurrent.matches({ edit: 'definition' })
  const hasActivities = (machineCurrent.context.activities || []).length > 0
  const queryData = get(selectedApiData, ACTION_TYPE_QUERY) || ({} as IRequestApiData)

  const { user, isCompanyAdmin, isSuperAdmin } = useUser()

  const notAllowedToUpdate = !isNewDataset && user.id !== dataset?.created_by && !isCompanyAdmin

  const runAll = () => onRunAllTabs()
  const runAllLive = () => onRunAllTabs({ runLive: true })

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

  // For save icon:
  const onSave = () => {
    if (notAllowedToUpdate) {
      return null
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

  return (
    <Space>
      <Tooltip title={editingDefinition ? 'Close edit definition' : 'Edit definition'}>
        <Button
          data-test="dataset-edit-definition-cta"
          disabled={!hasActivities}
          size="small"
          type="primary"
          onClick={() => {
            if (editingDefinition) {
              machineSend('CANCEL_EDIT_DEFINITION')
            } else {
              machineSend('EDIT_DEFINITION')
            }
          }}
        >
          {hasActivities && editingDefinition ? <CloseOutlined /> : <EditFilled />}
        </Button>
      </Tooltip>
      <Dropdown.Button
        data-test="dataset-manage-menu-ctas"
        size="small"
        disabled={!hasActivities || editingDefinition || savingDataset}
        onClick={onSave}
        buttonsRender={([leftButton, rightButton]: any[]) => {
          const dropdownTarget = React.cloneElement(rightButton, {
            key: 'right',
            'data-test': 'dataset-manage-dropdown-target',
            icon: <MoreOutlined />,
          })

          if (notAllowedToUpdate || dataset?.locked || cameFromNarrative) {
            const disabledLeftButton = React.cloneElement(leftButton, {
              key: 'left',
              disabled: true,
              'data-test': 'save-dataset-cta',
            })
            const getTitle = () => {
              if (dataset?.locked) {
                return <DatasetLockedDescription />
              }

              if (cameFromNarrative) {
                return <CameFromNarrativeDescription />
              }

              return 'Not your dataset. Please duplicate to make edits.'
            }

            return [
              <Tooltip key="right" title={() => getTitle()}>
                {disabledLeftButton}
              </Tooltip>,
              dropdownTarget,
            ]
          }

          const saveButton = React.cloneElement(leftButton, { key: 'left', 'data-test': 'save-dataset-cta' })

          return [saveButton, dropdownTarget]
        }}
        menu={{
          items: [
            {
              key: 'Edit Properties',
              disabled: notAllowedToUpdate || cameFromNarrative,
              onClick: () => onOpenToolOverlay({ toolType: TOOL_SAVE_DATASET }),
              icon: <SaveOutlined />,
              label: <span data-test="edit-properties-dataset-option">Edit Properties</span>,
            },
            {
              key: 'integrations',
              disabled: isNewDataset || notAllowedToUpdate || cameFromNarrative,
              onClick: handleOpenIntegrationOverlay,
              icon: <ExportOutlined />,
              label: <span data-test="integrations-dataset-option">Integrations</span>,
            },

            {
              key: 'Duplicate Dataset',
              disabled: isNewDataset,
              onClick: () => onOpenToolOverlay({ toolType: TOOL_COPY_FROM_NARRATIVE_DATASET }),
              icon: <BlockOutlined />,
              label: <span data-test="duplicate-dataset-option">Duplicate</span>,
            },

            {
              key: 'Share Dataset',
              disabled: isNewDataset,
              onClick: () => {
                copy(window.location.href)

                notification.success({
                  key: 'dataset-url-copied',
                  placement: 'topRight',
                  message: 'Dataset Url Copied',
                })
              },
              icon: <ShareAltOutlined />,
              label: <span data-test="share-dataset-option">Share Dataset</span>,
            },

            {
              key: 'Delete Dataset',
              disabled: isNewDataset || notAllowedToUpdate,
              onClick: () => onOpenToolOverlay({ toolType: TOOL_DELETE_DATASET }),
              icon: <DeleteOutlined />,
              label: <span data-test="delete-dataset-option">Delete</span>,
            },

            { type: 'divider' },

            {
              key: 'Run all tabs',
              onClick: runAll,
              icon: <CaretRightOutlined />,
              label: 'Run all tabs',
            },

            {
              key: 'Clear Cache',
              onClick: runAllLive,
              icon: <CaretRightOutlined />,
              label: <span data-test="clear-cache-option">Clear Cache</span>,
            },

            isSuperAdmin ? { type: 'divider' } : null,
            isSuperAdmin
              ? {
                  type: 'group',
                  label: 'Super Admin',
                  children: [
                    {
                      key: 'Toggle JSON',
                      onClick: handleToggleShowJson,
                      icon: <LockOutlined style={{ color: colors.red500 }} />,
                      label: 'Toggle JSON',
                    },
                    {
                      key: 'Toggle Sensitive Info',
                      disabled: !queryData.loaded,
                      onClick: handleToggleSensitiveInfo,
                      icon: <LockOutlined style={{ color: colors.red500 }} />,
                      label: 'Toggle Sensitive Info',
                    },
                  ],
                }
              : null,
          ],
        }}
      >
        <SaveOutlined />
      </Dropdown.Button>
    </Space>
  )
}

export default DatasetManageMenu
