import { ObjectFieldTemplateProps } from '@rjsf/core'
import { Tabs } from 'antd-next'
import { Flex } from 'components/shared/jawns'
import { filter, find, includes, isEmpty } from 'lodash'
import { useCallback, useEffect } from 'react'
import { generatePath, useHistory, withRouter } from 'react-router'
import { RouteComponentProps, useParams } from 'react-router-dom'
import { FlexProps } from 'rebass'
import { groupPropertiesByTab } from 'util/blocks/helpers'
import { TabsConfig } from 'util/blocks/interfaces'

import TabWithInfo from './TabWithInfo'

type RouteProps = RouteComponentProps<{ id?: string; tab?: string; company_slug: string }>

interface Props extends RouteProps {
  flexDirection: FlexProps['flexDirection']
  flexWrap: FlexProps['flexWrap']
  tabsConfig: TabsConfig
  properties: ObjectFieldTemplateProps['properties']
}

const ObjectFieldTabs = ({ flexDirection, flexWrap, tabsConfig, properties, match }: Props) => {
  const groupedTabs = groupPropertiesByTab(tabsConfig, properties)
  const history = useHistory()
  const { tab: tabParams } = useParams<{ tab?: string }>()

  const handleSwitchTabs = useCallback(
    (activeKey: string) => {
      // add tab_id to the route params
      const newPath = generatePath(match.path, {
        ...match.params,
        tab: encodeURI(activeKey),
      })

      history.push(newPath)
    },
    [history, generatePath, match]
  )

  // handle tab not existing
  useEffect(() => {
    if (groupedTabs.length > 0) {
      // if the url contains a tab param that does not / no longer exists
      // check for potential redirect_tab_ids in other tabs
      if (tabParams && !find(tabsConfig.tabs, ['tab_id', tabParams])) {
        const redirectToTabs = filter(groupedTabs, (tab) => includes(tab.redirect_tab_ids, tabParams))
        // if redirect to tabs are found
        // set the first one as the active tab and update the url
        if (!isEmpty(redirectToTabs)) {
          return handleSwitchTabs(redirectToTabs[0].tab_id)
        } else {
          // if no redirect tabs are found
          // default to first groupTab
          return handleSwitchTabs(groupedTabs[0].tab_id)
        }
      }
    }
  }, [groupedTabs, tabParams, handleSwitchTabs])

  const activeTab = find(groupedTabs, ['tab_id', tabParams]) || groupedTabs[0]

  // if there is no active tab there weren't any grouped tabs to select from
  // (we default to first groupedTab if no match from url params)
  // so do not try and render
  if (isEmpty(activeTab)) {
    return null
  }

  return (
    <Tabs
      activeKey={activeTab.tab_id}
      onChange={handleSwitchTabs}
      data-public
      items={groupedTabs.map((tab) => ({
        key: tab.tab_id,
        label: <TabWithInfo tab={tab} />,
        children: tab.properties.map((element: any) => (
          <Flex flexWrap={flexWrap} flexDirection={flexDirection} key={element.content.key}>
            {element.content}
          </Flex>
        )),
      }))}
    />
  )
}

export default withRouter(ObjectFieldTabs)
