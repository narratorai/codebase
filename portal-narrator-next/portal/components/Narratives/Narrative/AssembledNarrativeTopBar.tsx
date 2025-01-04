import {
  BlockOutlined,
  CalendarOutlined,
  CaretRightOutlined,
  DeleteOutlined,
  EditOutlined,
  FilterOutlined,
  FilterTwoTone,
  HighlightOutlined,
  MenuOutlined,
  PrinterOutlined,
  SettingOutlined,
  ShareAltOutlined,
} from '@ant-design/icons'
import { App, Badge, Button, Dropdown, Tooltip } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import DatasetLinksPopover from 'components/Narratives/Dashboards/AssembledDashboard/DatasetLinksPopover'
import DeleteNarrativeModal from 'components/Narratives/Modals/DeleteNarrativeModal'
import DuplicateNarrativeOverlay from 'components/Narratives/Modals/DuplicateNarrativeModal'
import SaveNarrativeModal from 'components/Narratives/Modals/SaveNarrativeModal'
import AnalysisContext from 'components/Narratives/Narrative/AnalysisContext'
import NarrativeActionModal from 'components/Narratives/Narrative/NarrativeActionModal'
import NarrativeActionsPopover from 'components/Narratives/Narrative/NarrativeActionsPopover'
import AssembledBadge from 'components/Narratives/shared/AssembledBadge'
import { Box, Flex, ScreenOnly, Typography } from 'components/shared/jawns'
import LargeScreenOnly from 'components/shared/LargeScreenOnly'
import ResourceStateIcon from 'components/shared/ResourceStateIcon'
import copy from 'copy-to-clipboard'
import { INarrative } from 'graph/generated'
import { compact, every, isEmpty, truncate } from 'lodash'
import { useContext, useEffect, useState } from 'react'
import { useHistory } from 'react-router'
import { colors } from 'util/constants'
import { timeFromNow } from 'util/helpers'
import { ASSEMBLED_NARRATIVE_TOP_BAR_HEIGHT } from 'util/narratives/constants'
import useToggle from 'util/useToggle'

interface Props {
  narrative: INarrative
  notAllowedToUpdate: boolean
  isDashboard?: boolean
  toggleDynamicFieldDrawer: () => void
  handleRunNarrative: () => void
  refetchNarrative: () => void
}

const AssembledNarrativeTopBar = ({
  narrative,
  notAllowedToUpdate,
  isDashboard = false,
  toggleDynamicFieldDrawer,
  handleRunNarrative,
  refetchNarrative,
}: Props) => {
  const { notification } = App.useApp()
  const company = useCompany()
  const { isCompanyAdmin } = useUser()

  // Print logic - stolen from PrintButton
  // getting hover errors when trying to convert PrintButton into a Menu.Item
  // so need to dupe here
  const {
    plotsLoaded,
    setForceRenderPlots,
    noQuestionsGoalsRecsTakeaways,
    analysisData,
    toggleShowDateRange,
    selectedFile,
  } = useContext(AnalysisContext)
  const [shouldPrint, setShouldPrint] = useState(false)

  const history = useHistory()

  const navigateToEdit = () => {
    history.push(`/${company.slug}/${isDashboard ? 'dashboards' : 'narratives'}/edit/${narrative.slug}`)
  }

  const [duplicateModalVisible, toggleDuplicateModalVisible] = useToggle(false)
  const [deleteModalVisible, toggleDeleteModalVisible] = useToggle(false)
  const [editPropertiesModalVisible, toggleEditPropertiesModalVisible] = useToggle(false)
  const onCloseEditPropertiesModal = () => {
    toggleEditPropertiesModalVisible()
    refetchNarrative()
  }

  const [showDashboardActions, setShowDashboardActions] = useState(false)

  const handleDeleteSuccess = () => {
    history.push(`/${company.slug}/${isDashboard ? 'dashboards' : 'narratives'}`)
  }

  // check that all plots have intiialized
  // so we can print with plots
  const allPlotsLoaded = every(plotsLoaded, Boolean)

  const handlePrint = () => {
    setForceRenderPlots(true)
    setShouldPrint(true)
  }

  // highjack the (cmd + p) hotkey to allow plots to load
  const handleQuickPrint = (event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.keyCode == 80) {
      event.preventDefault()
      handlePrint()
    }
  }

  useEffect(() => {
    if (shouldPrint && allPlotsLoaded) {
      setShouldPrint(false)
      // timeout helps page rerender before print dialogue
      setTimeout(() => {
        window.print()
      }, 0)
    }
  }, [shouldPrint, allPlotsLoaded])

  useEffect(() => {
    // add listener for cmd + p
    document.addEventListener('keydown', handleQuickPrint)

    return () => {
      // remove listener for cmd + p
      document.removeEventListener('keydown', handleQuickPrint)
    }
  }, [])

  const dashboardOrNarrativeText = isDashboard ? 'Dashboard' : 'Analysis'
  const dynamicFields = analysisData?.dynamic_fields
  const appliedFilters = analysisData?.applied_filters

  const menuItems = compact([
    {
      key: 'run-narrative',
      onClick: handleRunNarrative,
      disabled: notAllowedToUpdate,
      icon: <CaretRightOutlined />,
      label: `Run ${dashboardOrNarrativeText}`,
    },
    {
      key: 'print',
      onClick: handlePrint,
      icon: <PrinterOutlined />,
      label: 'Print',
    },
    {
      key: 'edit-narrative',
      onClick: navigateToEdit,
      icon: <EditOutlined data-test="edit-narrative-cta" />,
      label: `Edit ${dashboardOrNarrativeText}`,
    },
    {
      key: 'edit-narrative-properties',
      onClick: toggleEditPropertiesModalVisible,
      icon: <SettingOutlined data-test="edit-narrative-properties-cta" />,
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
      onClick: () => {
        copy(window.location.href)

        notification.success({
          key: 'share-narrative-url',
          placement: 'topRight',
          message: `${dashboardOrNarrativeText} Url Copied`,
        })
      },
      icon: <ShareAltOutlined data-test="share-narrative-cta" />,
      label: `Share ${dashboardOrNarrativeText}`,
    },
    {
      key: 'show-snapshot-options',
      onClick: toggleShowDateRange,
      icon: <CalendarOutlined data-test="delete-narrative-cta" />,
      label: 'Select Snapshot',
    },
    isDashboard
      ? {
          key: 'log-dashboard-action',
          onClick: () => setShowDashboardActions(true),
          icon: <HighlightOutlined />,
          label: 'Log Action',
        }
      : null,
  ])

  return (
    <LargeScreenOnly>
      <ScreenOnly>
        <Flex
          alignItems="center"
          justifyContent="space-between"
          px={3}
          mb={noQuestionsGoalsRecsTakeaways ? 0 : 4}
          style={{
            height: `${ASSEMBLED_NARRATIVE_TOP_BAR_HEIGHT}px`,
            backgroundColor: 'white',
          }}
        >
          {/* Title and state tag/updater */}
          <Flex alignItems="center">
            <Box mr={1}>
              <AssembledBadge narrative={narrative} />
            </Box>

            <Typography
              type="title300"
              data-test="assembled-narrative-name"
              mr={2}
              style={{ maxHeight: `${ASSEMBLED_NARRATIVE_TOP_BAR_HEIGHT}px`, overflow: 'hidden' }}
              title={narrative.name}
            >
              {truncate(narrative.name, { length: 80 })}
            </Typography>

            <Box mr={1}>
              <ResourceStateIcon state={narrative.state} />
            </Box>

            <Tooltip
              title={
                <Box>
                  {!isEmpty(dynamicFields) ? (
                    <Typography>Filter Narrative</Typography>
                  ) : (
                    <Box>
                      <Typography>No filters available</Typography>
                      <Typography>Please define in edit mode</Typography>
                    </Box>
                  )}
                </Box>
              }
            >
              <div>
                <Badge
                  color={colors.blue500}
                  size="small"
                  count={appliedFilters?.length ? appliedFilters?.length : undefined}
                >
                  <Button
                    size="small"
                    onClick={toggleDynamicFieldDrawer}
                    disabled={isEmpty(dynamicFields)}
                    icon={isEmpty(appliedFilters) ? <FilterOutlined /> : <FilterTwoTone />}
                  >
                    Apply Filters
                  </Button>
                </Badge>
              </div>
            </Tooltip>
          </Flex>

          {/* Run, print, edit icons */}
          <Flex alignItems="center">
            {/* Actions - show for Narratives */}
            {!isDashboard && (
              <Box mx={2}>
                <NarrativeActionsPopover narrative={narrative} />
              </Box>
            )}

            {isDashboard && (
              <Flex mr={3} alignItems="center">
                {selectedFile && (
                  <Typography mr={1} style={{ color: colors.gray500 }}>{`(${timeFromNow(
                    selectedFile.name
                  )})`}</Typography>
                )}

                <DatasetLinksPopover narrativeDatasets={narrative.narrative_datasets} />
              </Flex>
            )}

            <Dropdown
              menu={{
                items: menuItems,
              }}
            >
              <MenuOutlined style={{ color: colors.blue500 }} title="Options" />
            </Dropdown>
          </Flex>
        </Flex>

        {/* Modals below */}
        {duplicateModalVisible && (
          <DuplicateNarrativeOverlay
            onClose={toggleDuplicateModalVisible}
            narrative={narrative}
            isDashboard={isDashboard}
          />
        )}

        {deleteModalVisible && (
          <DeleteNarrativeModal
            onClose={toggleDeleteModalVisible}
            narrative={narrative}
            onSuccess={handleDeleteSuccess}
            isDashboard={isDashboard}
          />
        )}

        {editPropertiesModalVisible && (
          <SaveNarrativeModal
            narrative={narrative}
            onClose={onCloseEditPropertiesModal}
            canArchive={isCompanyAdmin}
            isDashboard={isDashboard}
          />
        )}

        {/* Show add action modal for dashboards
            (actions in dashboards are not as relevant
             and can only access via TopBar dropdown)
        */}
        {isDashboard && (
          <NarrativeActionModal
            narrativeId={narrative.id}
            visible={showDashboardActions}
            setVisible={setShowDashboardActions}
          />
        )}
      </ScreenOnly>
    </LargeScreenOnly>
  )
}

export default AssembledNarrativeTopBar
