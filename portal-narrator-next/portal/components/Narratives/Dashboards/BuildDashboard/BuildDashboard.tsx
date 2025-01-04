// https://github.com/react-grid-layout/react-grid-layout/issues/944#issuecomment-661137827
import 'node_modules/react-grid-layout/css/styles.css'
import 'node_modules/react-resizable/css/styles.css'

import { App, Empty, Tabs, Tooltip } from 'antd-next'
import { TabsProps } from 'antd-next/es/tabs'
import { useBuildNarrativeContext } from 'components/Narratives/BuildNarrative/BuildNarrativeProvider'
import { IContent } from 'components/Narratives/interfaces'
import DraggableTab from 'components/shared/DraggableTab'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { find, findIndex, get, includes, isArray, isEmpty, isString, map, round } from 'lodash'
import queryString from 'query-string'
import { Key, useCallback, useEffect, useMemo, useState } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { useField, useForm } from 'react-final-form'
import RGL, { Layout, WidthProvider } from 'react-grid-layout'
import { useHistory } from 'react-router'
import styled from 'styled-components'
import { colors } from 'util/constants'
import { DASHBOARD_LAYOUT_VERSION_1 } from 'util/dashboards/constants'
import { formatGridItemDimensions, getGridItemMinH } from 'util/dashboards/helpers'

import AddTabIcon from './AddTabIcon'
import BuildDashboardContext from './BuildDashboardContext'
import {
  DASHBOARD_BACKGROUND_COLOR,
  DASHBOARD_COLS,
  DASHBOARD_MARGIN,
  ROW_HEIGHT,
  SECTION_TAB_QUERY_KEY,
} from './constants'
import ContentItem from './ContentItems/ContentItem'
import ResizeHandle from './ResizeHandle'
import SectionTabMenu from './SectionTab/SectionTabMenu'
import UpdateDashboardContentModal from './UpdateDashboardContentModal'

// on drag/drop override the red background placeholer w/ blue
// and give the outside of content items a gray background
// also move resize away from rounded border of content
const StyledDashboardContainer = styled(Box)`
  height: 100%;
  background-color: ${DASHBOARD_BACKGROUND_COLOR};

  .react-grid-item.react-grid-placeholder {
    background-color: ${colors.blue500};
  }

  .react-grid-item > .react-resizable-handle.react-resizable-handle-se {
    bottom: 4px;
    right: 4px;
  }
`

const StyledTabsContainer = styled.div`
  background-color: white;

  .antd5-tabs-nav {
    margin: 0 !important;
  }
`

// used for setting draggableCancel in RGL
// which limits which elements can be dragged
// https://github.com/react-grid-layout/react-grid-layout#grid-layout-props
export const NON_DRAGGABLE_AREA_CLASSNAME = 'non-draggable-area-react-grid-layout'

const ResponsiveGridLayout = WidthProvider(RGL)

interface Props {
  updateDashboardContentInitialValues?: Partial<IContent>
}

const BuildDashboard = ({ updateDashboardContentInitialValues }: Props) => {
  const { notification } = App.useApp()
  const history = useHistory()
  const { change, batch } = useForm()
  const { loadingConfig } = useBuildNarrativeContext()
  const [newContentItemId, setNewContentItemId] = useState<string | undefined>()

  const isNewDashboard = includes(history.location.pathname, '/dashboards/new')

  const [resizeDimensions, setResizeDimensions] = useState<Layout | undefined>()
  const [hoverItemDimensions, setHoverItemDimensions] = useState<Layout | undefined>()

  const itemDimensionsToShow: Layout | undefined = useMemo(() => {
    if (resizeDimensions) {
      return resizeDimensions
    }

    if (hoverItemDimensions) {
      return hoverItemDimensions
    }

    return undefined
  }, [resizeDimensions, hoverItemDimensions])

  const [resizeHovered, setResizeHovered] = useState(false)

  const hoveredWithDimensions = resizeHovered && !isEmpty(hoverItemDimensions)
  const showTooltip = hoveredWithDimensions || !isEmpty(resizeDimensions)

  const {
    input: { value: sectionValues, onChange: onChangeSections },
  } = useField('narrative.sections', { subscription: { value: true } })

  // selected section tab comes from query params
  // (no params when it's the first section)
  const selectedTab = useMemo(() => {
    const queryParams = queryString.parse(history.location.search)
    const tabFromQuery = get(queryParams, SECTION_TAB_QUERY_KEY)

    if (tabFromQuery && isString(tabFromQuery)) {
      return tabFromQuery
    }

    // defualt to first tab if no param is found
    return sectionValues?.[0]?.id
  }, [history.location.search, queryString, sectionValues])

  const selectedSectionIndex = useMemo(() => {
    return findIndex(sectionValues, ['id', selectedTab])
  }, [selectedTab, sectionValues])

  const selectedSection = useMemo(() => {
    return find(sectionValues, ['id', selectedTab])
  }, [selectedTab, sectionValues])

  const selectedSectionContents = useMemo(() => {
    return selectedSection?.content
  }, [selectedSection])

  // update query params with selected tab
  const handleOnTabSelect = useCallback(
    (selectedKey: string) => {
      const existingSearch = queryString.parse(history.location.search)

      const newSearch = {
        ...existingSearch,
        // remove tab key if it's the first tab
        [SECTION_TAB_QUERY_KEY]: selectedKey,
      }

      history.push({
        search: `?${queryString.stringify(newSearch)}`,
      })
    },
    [history]
  )

  // redirect to first tab if the tab couldn't be found
  useEffect(() => {
    if (!loadingConfig && isArray(sectionValues) && !isEmpty(sectionValues)) {
      const existingSearch = queryString.parse(history.location.search)
      const defaultSearchWithTabQuery = {
        ...existingSearch,
        [SECTION_TAB_QUERY_KEY]: sectionValues[0].id,
      }

      // if there is no tab in query params - add it
      const tabFromQuery = get(existingSearch, SECTION_TAB_QUERY_KEY)
      if (!tabFromQuery) {
        return history.push({
          search: `?${queryString.stringify(defaultSearchWithTabQuery)}`,
        })
      }

      const tabFound = find(sectionValues, ['id', selectedTab])
      // otherwise if the tab wasn't found
      if (!tabFound) {
        // let the user know tab not found
        // (unless they refreshed on a "/new" dashboard)
        if (!isNewDashboard) {
          notification.warning({
            key: 'tab-not-found-warning',
            placement: 'topRight',
            message: 'Tab not found',
          })
        }

        // and redirect to the first tab
        history.push({
          search: `?${queryString.stringify(defaultSearchWithTabQuery)}`,
        })
      }
    }
  }, [sectionValues, selectedTab, history, loadingConfig, isNewDashboard])

  // on drag/drop/resize/page load
  // update form state with new grid_layout
  const handleLayoutChange = useCallback(
    (currentLayout: Layout[]) => {
      const updatedContentValues = map(selectedSectionContents, (contentValue) => {
        const currentGridLayout = find(currentLayout, ['i', contentValue.id]) || contentValue.grid_layout

        // enforce minHeights (as backfill for older versions)
        const minH = getGridItemMinH(contentValue.type)
        return {
          ...contentValue,
          grid_layout: {
            ...currentGridLayout,
            minH,
          },
        }
      })

      batch(() => {
        // (backfill for older dashboards created with different layout heights/widths)
        // updated the dashboard layout version so we don't format this sections' layout again
        change(`narrative.sections[${selectedSectionIndex}]._dashboard_layout_version`, DASHBOARD_LAYOUT_VERSION_1)

        // update the layout
        change(`narrative.sections[${selectedSectionIndex}].content`, updatedContentValues)
      })
    },
    [selectedSectionContents, change, selectedSectionIndex]
  )

  const handleUpdateContent = useCallback(
    (content: Partial<IContent>, isNew: boolean) => {
      // Edit content
      if (!isNew) {
        // use id to find index in existing content
        const editContentIndex = findIndex(selectedSectionContents, ['id', content.id])
        if (editContentIndex !== -1) {
          const updatedContent = [...selectedSectionContents]
          updatedContent[editContentIndex] = content

          change(`narrative.sections[${selectedSectionIndex}].content`, updatedContent)
        }
      }

      // NEW content
      if (isNew) {
        const updatedContent = [...selectedSectionContents, content]

        // add the content to form state
        change(`narrative.sections[${selectedSectionIndex}].content`, updatedContent)

        // add new content id for green animation
        setNewContentItemId(content.id)

        const scrollToNewElement = () => {
          if (content.id) {
            const newElement = document.getElementById(content.id)
            newElement?.scrollIntoView({ behavior: 'smooth' })
          }
        }

        // wait for the new content to be added to the DOM
        // before scrolling to it
        setTimeout(scrollToNewElement, 300)
      }
    },
    [selectedTab, selectedSectionContents, change, selectedSectionIndex]
  )

  const moveTabNode = (fromId: Key, toId: Key) => {
    const fromIndex = findIndex(sectionValues, ['id', fromId])
    const toIndex = findIndex(sectionValues, ['id', toId])

    // do nothing if they moved it back to original position
    if (fromIndex === toIndex) {
      return null
    }

    // do nothing if you can't find the from/to tab
    const fromTab = sectionValues[fromIndex]
    const toTab = sectionValues[toIndex]
    if (isEmpty(fromTab) || isEmpty(toTab)) {
      return null
    }

    const updatedSections = [...sectionValues]
    updatedSections[fromIndex] = toTab
    updatedSections[toIndex] = fromTab

    onChangeSections(updatedSections)
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

  const handleResize = useCallback((_layout: Layout[], _oldItem: Layout, newItem: Layout) => {
    setResizeDimensions(newItem)
  }, [])

  const handleOnResizeStop = useCallback(() => {
    setResizeDimensions(undefined)
  }, [])

  // don't show anything until section data present
  // (otherwise flashes default state)
  if (!isArray(sectionValues)) {
    return null
  }

  return (
    <Box mt={8} style={{ width: '100%', height: '100%', overflowY: 'auto' }} relative>
      <BuildDashboardContext.Provider
        value={{
          selectedTab,
          selectedSectionIndex,
          newContentItemId,
        }}
      >
        <StyledTabsContainer>
          <DndProvider backend={HTML5Backend}>
            <Tabs
              type="editable-card"
              animated={false}
              onChange={handleOnTabSelect}
              activeKey={selectedTab}
              addIcon={<AddTabIcon handleOnTabSelect={handleOnTabSelect} />}
              renderTabBar={renderTabBar}
              items={map(sectionValues, (section) => ({
                key: section.id,
                label: section.title || 'Untitled',
                closeIcon: <SectionTabMenu sectionId={section.id} />, // hi-jacking the closeIcon for rename, duplicate, delete)
              }))}
            />
          </DndProvider>
        </StyledTabsContainer>

        <StyledDashboardContainer p={3} pb={'400px'}>
          {isEmpty(selectedSectionContents) && (
            <Flex justifyContent="center" alignItems="center" style={{ height: '400px' }}>
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Add content above" />
            </Flex>
          )}

          <ResponsiveGridLayout
            onLayoutChange={handleLayoutChange}
            rowHeight={ROW_HEIGHT}
            cols={DASHBOARD_COLS}
            margin={DASHBOARD_MARGIN}
            resizeHandle={
              // add hover events to RGL's resizer
              // (so we can show content dimensions on hover)
              <ResizeHandle
                handleOnHover={() => setResizeHovered(true)}
                handleOnExitHover={() => setResizeHovered(false)}
              />
            }
            onResize={handleResize}
            onResizeStop={handleOnResizeStop}
            draggableCancel={`.${NON_DRAGGABLE_AREA_CLASSNAME}`}
          >
            {/* Content here */}
            {map(selectedSectionContents, (content, index) => {
              const fieldName = `narrative.sections[${selectedSectionIndex}].content[${index}]`

              return (
                <div
                  id={content.id} // useful for scroll into position on create
                  key={content.id}
                  data-grid={formatGridItemDimensions({
                    version: selectedSection?._dashboard_layout_version,
                    itemLayout: content.grid_layout,
                    contentType: content.type,
                  })}
                  // capture the dimensions of the content item being hovered over
                  // to reference in tooltip below
                  onMouseEnter={() => {
                    setHoverItemDimensions(content.grid_layout)
                  }}
                  onMouseLeave={() => {
                    setHoverItemDimensions(undefined)
                  }}
                >
                  {/* when hovering over the resize - or actually resizing 
                    show the dimensions of the affected content 
                */}
                  <Tooltip
                    placement="bottomRight"
                    open={
                      showTooltip &&
                      !isEmpty(itemDimensionsToShow) &&
                      itemDimensionsToShow?.i === content.grid_layout?.i // make sure you only show the tooltip for the affected item
                    }
                    title={
                      showTooltip
                        ? () => {
                            const roundedContentWidth = round(itemDimensionsToShow?.w || 0)
                            const roundedPercentWidth = round((roundedContentWidth / DASHBOARD_COLS) * 100)
                            const roundedContentHeight = round(itemDimensionsToShow?.h || 0)

                            return (
                              <Box>
                                <Typography
                                  style={{ color: 'white' }}
                                >{`w: ${roundedContentWidth}, h: ${roundedContentHeight}`}</Typography>
                                <Typography style={{ color: 'white' }}>{`(${roundedPercentWidth}% width)`}</Typography>
                              </Box>
                            )
                          }
                        : undefined
                    }
                  >
                    <ContentItem content={content} fieldName={fieldName} />
                  </Tooltip>
                </div>
              )
            })}
          </ResponsiveGridLayout>
        </StyledDashboardContainer>

        {!isEmpty(updateDashboardContentInitialValues) && (
          <UpdateDashboardContentModal
            onUpdate={handleUpdateContent}
            initialValues={updateDashboardContentInitialValues}
            selectedSectionContents={selectedSectionContents}
          />
        )}
      </BuildDashboardContext.Provider>
    </Box>
  )
}

export default BuildDashboard
