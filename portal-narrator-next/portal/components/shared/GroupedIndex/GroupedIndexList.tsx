import { ListProps } from 'antd/es/list'
import { Collapse, Empty, List, Spin } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { Box } from 'components/shared/jawns'
import { isEmpty, isEqual, map, without } from 'lodash'
import React, { useEffect, useState } from 'react'
import usePrevious from 'util/usePrevious'

import {
  getAllPossibleGroupKeys,
  groupItems,
  IGroupConfig,
  SearchablePathFunction,
  searchItems,
} from './services/helpers'

interface PrivateStringProps {
  value: string
}

const PrivateString: React.FC<PrivateStringProps> = ({ value }) => {
  return <div data-private>{value}</div>
}

interface GroupedIndexListProps extends ListProps<any> {
  empty?: React.ReactNode
  // TODO - make any a generic <T> type?
  items: any[]
  loading: boolean
  ghost?: boolean
  groupConfigs: IGroupConfig[]
  searchablePaths: (string | SearchablePathFunction)[]
  searchValue: string
  selectedGroup: string
  isSidebar?: boolean
  defaultClosedKeys?: string[]
  openAllPanels?: () => void
  customGroupHeader?: ({ groupKey, selectedGroup }: { groupKey: string; selectedGroup: string }) => string
}

const GroupedIndexList: React.FC<GroupedIndexListProps> = ({
  empty,
  items,
  loading,
  ghost = false,
  groupConfigs,
  renderItem,
  searchablePaths,
  searchValue,
  selectedGroup,
  isSidebar = false,
  defaultClosedKeys,
  openAllPanels,
  customGroupHeader,
}) => {
  const company = useCompany()
  const [activeKeys, setActiveKeys] = useState<string | string[]>([])

  const handlePanelChange = (keys: string | string[]) => {
    setActiveKeys(keys)
  }

  // Filter transformations based on search:
  const searchedItems = searchItems({ items, searchablePaths, searchValue })

  // Group searched transformations:
  const groupedData = groupItems({ items: searchedItems, groupConfigs, selectedGroup, tz: company?.timezone })
  const allGroupKeys = without(getAllPossibleGroupKeys({ items, groupConfigs }), ...(defaultClosedKeys || []))
  const prevAllGroupKeys = usePrevious(allGroupKeys)

  useEffect(() => {
    // set intial collapse open state
    if (!isEmpty(allGroupKeys) && !isEqual(prevAllGroupKeys?.length, allGroupKeys.length)) {
      setActiveKeys(allGroupKeys)
    }
  }, [allGroupKeys, setActiveKeys])

  useEffect(() => {
    if (openAllPanels) {
      // toggle all the collapse panels open
      setActiveKeys(allGroupKeys)
      // openAllPanels should toggle bool state from parent component
      // (do it once and turn itself off)
      openAllPanels()
    }
  }, [openAllPanels, allGroupKeys])

  return (
    <Spin size={isSidebar ? 'small' : 'large'} spinning={loading} tip="Loading..." style={{ minHeight: 400 }}>
      {/* Show Empty if it's done loading and there are no items */}
      {!loading &&
        isEmpty(items) &&
        (empty || (
          <Box mt={3}>
            <Empty />
          </Box>
        ))}

      {/* Show Empty if they searched for values, but nothing was found */}
      {!loading && !isEmpty(searchValue) && isEmpty(searchedItems) && (
        <Box mt={3}>
          <Empty description="No items found. Please revise your search." />
        </Box>
      )}

      {!isEmpty(items) && (
        <Collapse ghost={ghost} activeKey={activeKeys} onChange={handlePanelChange}>
          {map(groupedData, (items: any[], groupKey: string) => {
            return (
              // The header for DatasetIndex is a user email, so can't show it.
              <Collapse.Panel
                header={
                  <PrivateString
                    value={`${customGroupHeader ? customGroupHeader({ groupKey, selectedGroup }) : groupKey} (${
                      items?.length || 0
                    })`}
                  />
                }
                key={groupKey}
              >
                <List size={isSidebar ? 'small' : 'large'} dataSource={items} renderItem={renderItem} />
              </Collapse.Panel>
            )
          })}
        </Collapse>
      )}
    </Spin>
  )
}

export default GroupedIndexList
