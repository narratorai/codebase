import {
  BlockOutlined,
  CaretRightOutlined,
  DeleteOutlined,
  EditOutlined,
  MenuOutlined,
  ShareAltOutlined,
} from '@ant-design/icons'
import { App, Button, Dropdown, Space, Spin, Tooltip } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import CreateDashboardContentButton from 'components/Narratives/Dashboards/BuildDashboard/CreateDashboardContentButton'
import { IUpdateConfigCallbackInput } from 'components/Narratives/hooks/useUpdateConfig'
import { GetFileAPIReturn } from 'components/Narratives/interfaces'
import DeleteNarrativeModal from 'components/Narratives/Modals/DeleteNarrativeModal'
import DuplicateNarrativeOverlay from 'components/Narratives/Modals/DuplicateNarrativeModal'
import SaveNarrativeModal from 'components/Narratives/Modals/SaveNarrativeModal'
import EditNarrativeStateTag from 'components/Narratives/shared/EditNarrativeStateTag'
import { Box, Flex, Link, Typography } from 'components/shared/jawns'
import copy from 'copy-to-clipboard'
import { INarrative } from 'graph/generated'
import { filter, isEmpty, isEqual } from 'lodash'
import { EventHandler, FormEvent, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-final-form'
import { useHistory } from 'react-router'
import NarrativeIcon from 'static/img/narrativeBook.svg'
import analytics from 'util/analytics'
import { colors } from 'util/constants'
import { makeBuildNarrativeConfig } from 'util/narratives'
import { NarrativeFields } from 'util/narratives/interfaces'
import useToggle from 'util/useToggle'

import DefineFiltersButton from './DefineFiltersButton'
import QuickSaveListener from './QuickSaveListener'
import RenameNarrativeInput from './RenameNarrativeInput'

interface Props {
  assembling: boolean
  saving: boolean
  updateConfig: (config: IUpdateConfigCallbackInput) => void
  fields?: NarrativeFields
  loadingFields: boolean
  loadingConfig: boolean
  handleAssembleNarrative: EventHandler<FormEvent>
  errors: any
  invalid: boolean
  submitFailed: boolean
  submitCounter: number
  narrative?: Partial<INarrative>
  refetchNarrative: () => void
  isNew: boolean
  isDashboard: boolean
}

const loadingLabel = ({
  saving,
  loadingFields,
  loadingConfig,
  assembling,
}: {
  saving: boolean
  loadingFields: boolean
  loadingConfig: boolean
  assembling: boolean
}) => {
  const loadingLabels = [
    { label: 'saving', active: saving },
    { label: 'loading fields', active: loadingFields },
    { label: 'loading config', active: loadingConfig },
    { label: 'assembling', active: assembling },
  ]
  return filter(loadingLabels, { active: true })
    .map((entry) => entry.label)
    .join(' | ')
}

const NarrativeTopBar = ({
  assembling,
  saving,
  fields,
  updateConfig,
  loadingFields,
  loadingConfig,
  handleAssembleNarrative,
  errors,
  invalid,
  submitFailed,
  submitCounter,
  narrative,
  refetchNarrative,
  isNew,
  isDashboard = false,
}: Props) => {
  const { notification } = App.useApp()
  const { isCompanyAdmin } = useUser()
  const history = useHistory()
  const company = useCompany()

  const { getState, reset } = useForm()

  const [narrativeConfig, setNarrativeConfig] = useState<GetFileAPIReturn>()
  const [duplicateModalVisible, toggleDuplicateModalVisible] = useToggle(false)
  const [deleteModalVisible, toggleDeleteModalVisible] = useToggle(false)
  const [editModalVisible, toggleEditModalVisible] = useToggle(false)
  const onCloseEditModalVisible = () => {
    toggleEditModalVisible()
    refetchNarrative()
  }

  const handleDeleteSuccess = () => {
    history.push(`/${company.slug}/narratives`)
  }

  // since we are programmatically firing save (not via submit)
  // reset form state to prevent unnecessary prevent backs (via dirty check)
  const handleReset = () => {
    const formValue = getState()?.values
    reset(formValue)
  }

  // use submitCounter as a proxy for each time the user submits the form!
  // so we don't keep repeatedly showing the error notification:
  const lastSubmitCounter = useRef(submitCounter)

  // this allows us to show different loading
  // label texts below the loading spinner
  const activeLabels = loadingLabel({ saving, loadingFields, loadingConfig, assembling })

  const lastAssembled = narrative?.narrative_runs?.[0]?.created_at

  const dashboardOrNarrativeText = isDashboard ? 'Dashboard' : 'Analysis'

  const handleOpenEditProperties = () => {
    const formValue = getState()?.values

    const updatedNarrativeConfig = makeBuildNarrativeConfig({ formValue, fields })
    // narrative config is passed in the update narrative modal
    // (so we can also save the changes to the narrative - not just it's meta data)
    setNarrativeConfig(updatedNarrativeConfig)

    toggleEditModalVisible()
  }

  const handleClickSaveButton = () => {
    // if new, make sure they enter in the meta data first
    if (isNew) {
      return handleOpenEditProperties()
    }

    // if edit
    if (narrative?.slug) {
      const formValue = getState()?.values
      const updatedNarrativeConfig = makeBuildNarrativeConfig({ formValue, fields })

      updateConfig({ updatedNarrativeConfig, narrativeSlug: narrative.slug })

      handleReset()
    }
  }

  useEffect(() => {
    // // Form Specific Errors
    if (!isEmpty(errors) && !isEqual(lastSubmitCounter.current, submitCounter) && invalid && submitFailed) {
      const errorMessage = 'Form is invalid. Please check that all fields are valid and save again.'
      notification.error({
        key: `error-with-narrative-form-fields-${narrative?.name}`,
        placement: 'topRight',
        message: errorMessage,
        duration: null,
      })
      analytics.track('received_error_message', {
        message: errorMessage,
      })
      lastSubmitCounter.current = submitCounter
    }
  }, [errors, invalid, submitFailed, submitCounter, narrative, notification])

  const handleShareNarrative = () => {
    copy(window.location.href)

    notification.success({
      key: 'share-narrative-url',
      placement: 'topRight',
      message: `${dashboardOrNarrativeText} Url Copied`,
    })
  }

  const menuItems = [
    {
      key: 'edit-narrative',
      onClick: handleOpenEditProperties,
      icon: <EditOutlined data-test="edit-narrative-cta" />,
      label: 'Edit Properties',
    },
    {
      key: 'duplicate-narrative',
      onClick: toggleDuplicateModalVisible,
      icon: <BlockOutlined data-test="duplicate-narrative-cta" />,
      label: `Duplicate ${dashboardOrNarrativeText}`,
    },
    {
      key: 'delete-narrative',
      onClick: toggleDeleteModalVisible,
      icon: <DeleteOutlined data-test="delete-narrative-cta" />,
      label: `Delete ${dashboardOrNarrativeText}`,
    },
    {
      key: 'share-narrative',
      onClick: handleShareNarrative,
      icon: <ShareAltOutlined data-test="share-narrative-cta" />,
      label: `Share ${dashboardOrNarrativeText}`,
    },
  ]

  return (
    <Flex bg="white" px={3} py={2} justifyContent="space-between" alignItems="center">
      <Box flexGrow={1}>
        <Flex alignItems="center" flexWrap="wrap">
          {!narrative && !loadingConfig && (
            <Typography mr={2} type="title400">
              New {dashboardOrNarrativeText}
            </Typography>
          )}

          {narrative && (
            <Box mr={2}>
              <RenameNarrativeInput narrative={narrative} refetchNarrative={refetchNarrative} />
            </Box>
          )}

          {narrative && (
            <Box mr={1}>
              <EditNarrativeStateTag narrative={narrative} refetchNarrative={refetchNarrative} />
            </Box>
          )}

          <Tooltip
            title={
              isEmpty(lastAssembled)
                ? `No Assembled ${dashboardOrNarrativeText}s`
                : `View Last ${dashboardOrNarrativeText}`
            }
          >
            <Box mr={1}>
              <Link
                unstyled
                to={`/${isDashboard ? 'dashboards' : 'narratives'}/a/${narrative?.slug}`}
                target="_blank"
                data-test="narrative-view-link"
              >
                <Button
                  size="small"
                  disabled={isEmpty(lastAssembled)}
                  icon={
                    <Flex alignItems="center" justifyContent="center">
                      <NarrativeIcon />
                    </Flex>
                  }
                />
              </Link>
            </Box>
          </Tooltip>

          {isDashboard && (
            <Box ml={1}>
              <CreateDashboardContentButton />
            </Box>
          )}
        </Flex>
      </Box>

      <Space>
        {activeLabels && (
          <Box mr={2}>
            <Space align="center">
              <Typography>{activeLabels}</Typography>
              <Spin spinning={!!activeLabels} />
            </Space>
          </Box>
        )}

        <DefineFiltersButton narrative={narrative} />

        <Tooltip title={isNew ? 'Please save the narrative before running' : 'Save and Run'}>
          <div>
            <Button
              onClick={handleAssembleNarrative}
              disabled={assembling || isNew}
              data-test="narrative-assemble-cta"
              icon={<CaretRightOutlined style={{ color: colors.green500 }} />}
            />
          </div>
        </Tooltip>

        <Button type="primary" onClick={handleClickSaveButton} disabled={saving} data-test="narrative-save-cta">
          Save
        </Button>

        <div data-test="narrative-options-dropdown">
          <Dropdown
            menu={{
              items: menuItems,
            }}
          >
            <MenuOutlined style={{ color: colors.blue500 }} title="Options" />
          </Dropdown>
        </div>

        <QuickSaveListener handleSave={handleClickSaveButton} />

        {duplicateModalVisible && (
          <DuplicateNarrativeOverlay
            onClose={toggleDuplicateModalVisible}
            narrative={narrative as INarrative | undefined}
            isDashboard={isDashboard}
          />
        )}

        {deleteModalVisible && (
          <DeleteNarrativeModal
            onClose={toggleDeleteModalVisible}
            narrative={narrative as INarrative | undefined}
            onSuccess={handleDeleteSuccess}
            isDashboard={isDashboard}
          />
        )}

        {editModalVisible && (
          <SaveNarrativeModal
            narrative={narrative as INarrative}
            onClose={onCloseEditModalVisible}
            canArchive={isCompanyAdmin}
            isDashboard={isDashboard}
            narrativeConfig={narrativeConfig}
            onCreateSuccess={handleReset}
          />
        )}
      </Space>
    </Flex>
  )
}

export default NarrativeTopBar
