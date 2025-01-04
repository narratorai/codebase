// https://github.com/react-grid-layout/react-grid-layout/issues/944#issuecomment-661137827
import 'node_modules/react-grid-layout/css/styles.css'
import 'node_modules/react-resizable/css/styles.css'

import { App, Tabs } from 'antd-next'
import AssembledContentItem, {
  AssembledContentItemContent,
} from 'components/Narratives/Dashboards/AssembledDashboard/ContentItems/AssembledContentItem'
import {
  DASHBOARD_COLS,
  INNER_CONTENT_BORDER_RADIUS,
  INNER_CONTENT_HORIZONTAL_PADDING,
  INNER_CONTENT_VETICAL_PADDING,
  ROW_HEIGHT,
  SECTION_TAB_QUERY_KEY,
} from 'components/Narratives/Dashboards/BuildDashboard/constants'
import AnalysisContext from 'components/Narratives/Narrative/AnalysisContext'
import { PLOT_SKELETON_CLASS } from 'components/shared/DynamicPlot'
import { Box } from 'components/shared/jawns'
import { useLayoutContext } from 'components/shared/layout/LayoutProvider'
import { IGetNarrativeBySlugQuery } from 'graph/generated'
import html2canvas from 'html2canvas'
import _ from 'lodash'
import moment from 'moment-timezone'
import queryString from 'query-string'
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import RGL, { Layout, WidthProvider } from 'react-grid-layout'
import { useHistory } from 'react-router'
import styled from 'styled-components'
import { colors, SIDENAV_WIDTH, SIDENAV_WIDTH_COLLAPSED } from 'util/constants'
import { formatGridItemDimensions } from 'util/dashboards/helpers'
import { ALL_PLOT_TYPES, ASSEMBLED_NARRATIVE_TOP_BAR_HEIGHT } from 'util/narratives/constants'
import { useLazyCallMavis } from 'util/useCallMavis'
import usePrevious from 'util/usePrevious'

import { getLogger } from '@/util/logger'

const logger = getLogger()

const SNAPSHOT_CONTAINER_ID = 'container-for-snapshot'
const MIN_WINDOW_WIDTH = 1200
const MIN_WINDOW_HEIGHT = 800

const StyledTabsContainer = styled(Box)`
  background-color: white;

  .antd5-tabs-nav {
    margin: 0 !important;
  }

  @media print {
    display: none;
  }
`

const ReactGridLayout = WidthProvider(RGL)

type NarrativeFromQuery = IGetNarrativeBySlugQuery['narrative']

// Take Snapshot if screen is large enough,
// you are on the first section
// and the snapshot is older than the last assembled run
const shouldTakeSnapshot = ({
  allPlotsLoaded,
  lastSnapshot,
  lastAssembled,
  isFirstSection,
}: {
  allPlotsLoaded: boolean
  lastSnapshot?: string
  lastAssembled?: string
  isFirstSection: boolean
}) => {
  // make sure you are on the first section (and all the plots were loaded)
  if (!isFirstSection || !allPlotsLoaded) {
    return false
  }
  // and the window is not too small
  if (window.innerWidth >= MIN_WINDOW_WIDTH && window.innerHeight >= MIN_WINDOW_HEIGHT) {
    // if there is no snapshot take a snapshot
    if (!lastSnapshot) {
      return true
    }
    // if the snapshot is older than the last assembled run take a snapshot
    if (moment(lastSnapshot).isBefore(lastAssembled)) {
      return true
    }
  }

  // default false
  return false
}

interface Props {
  narrativeConfig?: NarrativeFromQuery[number]
}

const DashboardView: React.FC<Props> = ({ narrativeConfig }) => {
  const { notification } = App.useApp()
  const history = useHistory()
  const { analysisData, setPlotsLoaded } = useContext(AnalysisContext)
  const { collapsed } = useLayoutContext()

  const narrative = analysisData?.narrative

  // keep track if all the plots are loaded on the first section
  // to know whether we can take a snapshot
  const [allFirstSectionPlotsLoaded, setAllFirstSectionPlotsLoaded] = useState(false)

  // only take snapshot once:
  // stop race condition between building the image and being to save it
  // otherwise it will generate the image over and over
  const [hasTakenSnapshot, setHasTakenSnapshot] = useState(false)

  const [updateImage] = useLazyCallMavis({
    method: 'POST',
    path: '/v1/narrative/update_image',
    retryable: true,
  })

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
    if (!_.isEmpty(narrative?.sections)) {
      const existingSearch = queryString.parse(history.location.search)
      const defaultSearchWithTabQuery = {
        ...existingSearch,
        [SECTION_TAB_QUERY_KEY]: narrative?.sections?.[0].id,
      }

      // if there is no tab in query params - add it
      const tabFromQuery = _.get(existingSearch, SECTION_TAB_QUERY_KEY)
      if (!tabFromQuery) {
        return history.push({
          search: `?${queryString.stringify(defaultSearchWithTabQuery)}`,
        })
      }

      // otherwise if the tab wasn't found
      const tabFound = _.find(narrative?.sections, ['id', selectedTab])
      if (!tabFound) {
        // let the user know tab not found
        notification.warning({
          key: 'tab-not-found-warning',
          placement: 'topRight',
          message: 'Tab not found',
        })

        // and redirect to the first tab
        history.push({
          search: `?${queryString.stringify(defaultSearchWithTabQuery)}`,
        })
      }
    }
  }, [narrative?.sections, history])

  // selected section tab comes from query params
  const selectedTab = useMemo(() => {
    const queryParams = queryString.parse(history.location.search)
    const tabFromQuery = _.get(queryParams, SECTION_TAB_QUERY_KEY)

    if (tabFromQuery && _.isString(tabFromQuery)) {
      return tabFromQuery
    }

    // default to first section id if  no tab query param is found
    return narrative?.sections?.[0]?.id
  }, [history.location.search, queryString, narrative?.sections])

  const selectedSection = _.find(narrative?.sections, ['id', selectedTab])
  const prevSelectedSection = usePrevious(selectedSection)
  const selectedSectionIndex = _.findIndex(narrative?.sections, ['id', selectedTab])

  // before print of a section (tab), ensure plots are loaded for each section
  useEffect(() => {
    if (selectedSection && prevSelectedSection?.id !== selectedSection?.id) {
      const allPlotsLoaded: boolean[] = []

      // go through each content and check if it is a plot
      _.forEach(selectedSection.content, (content) => {
        if (_.includes(ALL_PLOT_TYPES, content.type)) {
          // intitialize this plot as not loaded
          allPlotsLoaded.push(false)
        }
      })

      setPlotsLoaded(allPlotsLoaded)
    }
  }, [setPlotsLoaded, prevSelectedSection, selectedSection])

  // poll for all plots loaded on first section (for auto snapshot)
  useEffect(() => {
    const interval = setInterval(() => {
      const plotSkeletons = document.getElementsByClassName(PLOT_SKELETON_CLASS)

      if (_.isEmpty(plotSkeletons) && selectedSectionIndex === 0) {
        setAllFirstSectionPlotsLoaded(true)
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [selectedSectionIndex])

  // Take snapshot
  const handleTakeSnapshot = async () => {
    // Get the Dashboard content element (to take snapshot of)
    const element = document.getElementById(SNAPSHOT_CONTAINER_ID)
    // early escape if element is not found
    if (!element) {
      return
    }

    // Height should be no larger than window height
    // and no larger than the height of the content
    // (use the smaller of the two)
    const windowHeight = window.innerHeight
    const elementHeight = element.clientHeight
    // shouldn't happen, but default to window height
    const height = _.min([windowHeight, elementHeight]) || windowHeight

    // Get the visible w/h dimensions of the Dashboard content element
    const imageHeight = height - ASSEMBLED_NARRATIVE_TOP_BAR_HEIGHT
    const sidebarWidth = collapsed ? SIDENAV_WIDTH_COLLAPSED : SIDENAV_WIDTH
    const imageWidth = window.innerWidth - sidebarWidth

    // make sure user is still viewing this window tab before creating a snapshot
    const windowTabIsActive = !document.hidden

    if (element && narrativeConfig?.id && windowTabIsActive) {
      const canvas = await html2canvas(element, {
        width: imageWidth,
        height: imageHeight,
        scale: 0.5,
      })

      const image = canvas.toDataURL('image/png', 1.0)

      if (image) {
        logger.info({ image })
        updateImage({ body: { narrative_id: narrativeConfig.id, image } })
      }
    }
  }

  const lastSnapshot = narrativeConfig?.snapshot_updated_at
  const lastAssembled = narrativeConfig?.narrative_runs[0]?.created_at

  // determine whether we should take a snpahost
  // of the assembled dashboard
  useEffect(() => {
    const takeSnapshot = shouldTakeSnapshot({
      lastAssembled,
      lastSnapshot,
      isFirstSection: selectedSectionIndex === 0,
      allPlotsLoaded: allFirstSectionPlotsLoaded,
    })

    // make sure snapshot is ready and should be taken
    // and it hasn't already been taken
    if (takeSnapshot && !hasTakenSnapshot) {
      setHasTakenSnapshot(true)
      handleTakeSnapshot()
    }
  }, [lastAssembled, lastSnapshot, selectedSectionIndex, handleTakeSnapshot, allFirstSectionPlotsLoaded])

  const selectedSectionContents = useMemo(() => {
    return selectedSection?.content || []
  }, [selectedSection])

  return (
    <Box
      style={{
        width: '100%',
        height: '100%',
        overflowY: 'auto',
      }}
      relative
    >
      <StyledTabsContainer pl={3} data-test="assembled-dashboard-tabs">
        <Tabs
          onChange={handleOnTabSelect}
          activeKey={selectedTab}
          items={_.map(narrative?.sections, (section) => ({
            key: section.id,
            label: section.title || 'Untitled',
          }))}
        />
      </StyledTabsContainer>

      <Box style={{ backgroundColor: colors.gray100, height: '100%' }} px={3} mb={6} id={SNAPSHOT_CONTAINER_ID}>
        <ReactGridLayout
          isDraggable={false}
          isResizable={false}
          rowHeight={ROW_HEIGHT}
          cols={DASHBOARD_COLS}
          // force top/left rather than transform to allow for html2Canvas snapshot
          useCSSTransforms={false}
        >
          {/* Content here */}
          {_.map(selectedSectionContents, (content) => (
            <div
              key={content.id}
              id={content.id}
              data-grid={formatGridItemDimensions({
                version: selectedSection?._dashboard_layout_version,
                itemLayout: content.grid_layout as Layout,
                contentType: content.type,
              })}
              style={{
                overflow: 'hidden',
                padding: `${INNER_CONTENT_VETICAL_PADDING}px ${INNER_CONTENT_HORIZONTAL_PADDING}px`,
                border: `1px solid ${colors.gray300}`,
                borderRadius: `${INNER_CONTENT_BORDER_RADIUS}px`,
                backgroundColor: 'white',
                boxShadow: '0 16px 32px 0 rgb(0 0 0 / 5%)',
              }}
            >
              <AssembledContentItem content={content as AssembledContentItemContent} />
            </div>
          ))}
        </ReactGridLayout>
      </Box>
    </Box>
  )
}

export default DashboardView
