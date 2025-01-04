/* eslint-disable max-lines-per-function */
import { DatabaseOutlined, LoadingOutlined, TabletOutlined } from '@ant-design/icons'
import { TabsProps } from 'antd/lib/tabs'
import { App, Space, Spin, Tabs } from 'antd-next'
import { useAuth0 } from 'components/context/auth/hooks'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { ACTION_TYPE_METRICS, ACTION_TYPE_QUERY } from 'components/Datasets/BuildDataset/datasetReducer'
import DraggableTab from 'components/shared/DraggableTab'
import { Box, BoxProps, Flex, Typography } from 'components/shared/jawns'
import { get, includes, isEmpty } from 'lodash'
import { makeQueryDefinitionFromContext } from 'machines/datasets/helpers'
import { Key, useContext } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import styled from 'styled-components'
import { RAW_DATASET_KEY } from 'util/datasets'
import { emailLargeDatasetCsv, fetchRunDataset } from 'util/datasets/api'
import { IDatasetFormContext, IDatasetQueryGroup, IRequestApiData, ITabApiData } from 'util/datasets/interfaces'
import { downloadCsv } from 'util/download'
import { handleMavisErrorNotification } from 'util/useCallMavis'

import GroupByCtaAndPopover from './GroupByCtaAndPopover'
import TabMenu from './TabMenu'

const StyledTabs = styled(Tabs)`
  width: 100%;

  & .antd5-tabs-nav {
    margin-bottom: 0;
    align-items: flex-end;
  }

  .antd5-tabs-nav .antd5-tabs-nav-wrap {
    flex: initial;
  }

  /* see NOTE below about why we are hiding content */
  & .antd5-tabs-content {
    display: none;
  }
`

interface IRenderTabTitleProps extends BoxProps {
  title?: string
  slug: string
  group?: IDatasetQueryGroup
  activeKey: string
  handleDelete?: (param: any) => void
  handleDuplicate?: (param: any) => void
  handleRename?: (param: any) => void
  handleDuplicateParent?: () => void
  tabApiData: ITabApiData
}

interface Props {
  [key: string]: any
}

const TabHeaders = ({ ...props }: Props) => {
  const { getTokenSilently } = useAuth0()
  const company = useCompany()
  const { companyUser } = useUser()
  const { notification } = App.useApp()

  // const [downloadError, setDownloadError] = useState<MavisError | undefined>()

  const { datasetSlug, groupSlug, machineCurrent, machineSend, selectedApiData, datasetApiStates } =
    useContext<IDatasetFormContext>(DatasetFormContext) || {}
  const queryData = get(selectedApiData, ACTION_TYPE_QUERY, {} as IRequestApiData)
  const allGroups = machineCurrent.context.all_groups || []
  const activeKey = groupSlug || RAW_DATASET_KEY

  const staleTabs = machineCurrent.context._stale_tabs
  const tabsColumnsOrder = get(machineCurrent.context.columns_order, groupSlug || 'parent')

  // don't allow user to download if tab is stale or if the query is still running
  const disableDownload = includes(staleTabs, activeKey) || get(queryData, 'loading')

  const rowCount = datasetApiStates[activeKey]?.total_rows
  const rowCountTooLarge = (rowCount || 0) > 10000

  const handleRestoreColumnOrderDefaults = () => {
    machineSend('RESTORE_COLUMNS_ORDER_DEFAULTS', { groupSlug })
  }

  const handleDuplicateParent = () => {
    machineSend('DUPLICATE_PARENT')
  }

  const handleDownload = async () => {
    const queryDefinition = makeQueryDefinitionFromContext(machineCurrent.context)
    const notificationKey = `downloading_notification_${activeKey}`

    try {
      notification.info({
        key: notificationKey,
        message: 'Preparing CSV for download',
        description: <Spin />,
        duration: 0,
      })

      if (rowCountTooLarge) {
        // For tables with 1k+ rows
        const response = await emailLargeDatasetCsv({
          getToken: getTokenSilently,
          company,
          groupSlug,
          queryDefinition,
          companyUserId: companyUser?.id,
        })

        notification.destroy(notificationKey)

        if (response) {
          notification.info({
            key: `large_download_completed_${groupSlug}`,
            message: 'CSV download link will be emailed to you',
            duration: null,
            description: (
              <Box>
                <Typography>
                  You are trying to download more than 1K rows so we will trigger this download and you will be emailed
                  when ready.
                </Typography>
                <Typography mt={1}>Please give it 5 minutes as the data gets prepared.</Typography>
              </Box>
            ),
          })
        }
      } else {
        // For tables with less than 1k rows
        const fileName = !datasetSlug ? 'new_dataset' : groupSlug ? `${datasetSlug}_${groupSlug}` : datasetSlug

        const response = await fetchRunDataset({
          getToken: getTokenSilently,
          company,
          groupSlug,
          queryDefinition,
          asCsv: true,
        })

        notification.destroy(notificationKey)

        downloadCsv({ csvData: response, fileName })
      }
    } catch (error: any) {
      notification.destroy(notificationKey)
      handleMavisErrorNotification({ error, notification })
    }
  }

  const renderTabTitle = ({
    title,
    slug,
    group,
    activeKey,
    handleDelete,
    handleDuplicate,
    handleRename,
    tabApiData,
  }: IRenderTabTitleProps) => {
    const isActive = slug === activeKey
    const isDuplicateParentGroup = !!group?.is_parent

    const tabQueryData = get(tabApiData, ACTION_TYPE_QUERY, {}) as IRequestApiData
    const tabMetricData = get(tabApiData, ACTION_TYPE_METRICS, {}) as IRequestApiData
    const tabLoadingData = tabQueryData.loading || tabMetricData.loading

    return (
      <Flex justifyContent="space-between">
        <Space align="center">
          {slug === RAW_DATASET_KEY ? (
            <>
              {tabLoadingData ? (
                <LoadingOutlined style={{ marginRight: 0 }} data-test="tab-headers-dataset-loading" />
              ) : (
                <DatabaseOutlined style={{ marginRight: 0 }} data-test="tab-headers-dataset-not-loading" />
              )}
              <span data-public data-test="parent-tab">
                PARENT
              </span>
            </>
          ) : (
            <>
              {tabLoadingData && <LoadingOutlined style={{ marginRight: 0 }} />}

              {/* Show icon for active duplicate parent groups */}
              {!tabLoadingData && isDuplicateParentGroup && <TabletOutlined style={{ marginRight: 0 }} />}
              <span data-test={`group-tab${group?.is_parent ? '-parent-duplicate' : ''}`}>{title}</span>
            </>
          )}

          {isActive && (
            <TabMenu
              slug={slug}
              group={group}
              disableDownload={disableDownload}
              handleDownload={handleDownload}
              handleDelete={handleDelete}
              handleDuplicate={handleDuplicate}
              handleRename={handleRename}
              showRestoreColumnOrder={!isEmpty(tabsColumnsOrder)}
              handleRestoreColumnOrderDefaults={handleRestoreColumnOrderDefaults}
              handleDuplicateParent={handleDuplicateParent}
            />
          )}
        </Space>
      </Flex>
    )
  }

  const moveTabNode = (fromSlug: Key, toSlug: Key) => {
    machineSend('UPDATE_GROUP_TAB_ORDER', { fromSlug, toSlug })
  }

  const renderTabBar: TabsProps['renderTabBar'] = (tabBarProps, DefaultTabBar) => {
    return (
      <DefaultTabBar {...tabBarProps}>
        {(node) => {
          return (
            <DraggableTab key={node.key} index={node.key!} moveNode={moveTabNode}>
              {node}
            </DraggableTab>
          )
        }}
      </DefaultTabBar>
    )
  }

  return (
    <Flex flexDirection="column" alignItems="flex-start" justifyContent="space-between" {...props}>
      <Flex alignItems="flex-end" width="100%">
        <DndProvider backend={HTML5Backend}>
          <StyledTabs
            type="card"
            animated={false}
            activeKey={activeKey}
            tabBarExtraContent={
              <Box mx={1}>
                <GroupByCtaAndPopover />
              </Box>
            }
            onChange={(activeKey) => {
              if (activeKey === RAW_DATASET_KEY) {
                machineSend('SELECT_GROUP', { groupSlug: null })
              } else {
                machineSend('SELECT_GROUP', { groupSlug: activeKey })
              }
            }}
            renderTabBar={renderTabBar}
            items={[
              /* NOTE: we need to create these empty TabPane's so that
              the antd tabs work properly. We are hiding them using
              display: none and just using the `activeKey` and `onChange`
              from the Tabs to show the proper table content */
              {
                key: RAW_DATASET_KEY,
                label: renderTabTitle({
                  slug: RAW_DATASET_KEY,
                  activeKey,
                  tabApiData: get(datasetApiStates, RAW_DATASET_KEY),
                }),
              },

              ...allGroups.map((group) => {
                const handleDelete = () => {
                  machineSend('DELETE_GROUP')
                }

                const handleDuplicate = () => {
                  machineSend('DUPLICATE_GROUP', { groupSlug })
                }

                const handleRename = () => {
                  machineSend('RENAME_GROUP')
                }

                const tabApiData = get(datasetApiStates, group.slug)

                return {
                  key: group.slug,
                  label: renderTabTitle({
                    title: group.name,
                    slug: group.slug,
                    group,
                    activeKey,
                    handleDelete,
                    handleDuplicate,
                    handleRename,
                    tabApiData,
                  }),
                }
              }),
            ]}
          />
        </DndProvider>
      </Flex>
    </Flex>
  )
}

export default TabHeaders
