import { CloseOutlined, DownOutlined, RightOutlined, SyncOutlined } from '@ant-design/icons'
import { Tooltip } from 'antd-next'
import appendQuery from 'append-query'
import { Box, Flex, Link, Typography } from 'components/shared/jawns'
import { isEmpty, isEqual, toString, truncate } from 'lodash'
import React, { useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'
import { colors } from 'util/constants'
import { GLOBAL_CTA_HEIGHT } from 'util/datasets/constants'
import { IDatasetQueryDefinition } from 'util/datasets/interfaces'
import usePrevious from 'util/usePrevious'

import ActivityStream from './ActivityStream'
import CustomerProfile from './CustomerProfile'
import { CUSTOMER_JOURNEY_AS_SIDEBAR_WIDTH, GET_CUSTOMER_JOURNEY_LIMIT } from './services/constants'
import useGetCustomerJourneyFromDataset from './services/useGetCustomerJourneyFromDataset'

const ACTIVITY_STREAM_CONTAINER_ID = 'customer_drawer_activity_stream'

interface Props {
  customerJourneyRow?: any
  customerJourneyOptions?: {
    fullJourney?: boolean
  }
  setCustomerJourneyRow: (row: any) => void
  queryDefinition: IDatasetQueryDefinition
}

const StyledLoading = styled(Flex)`
  writing-mode: vertical-rl;
  text-orientation: mixed;
  justify-content: center;
  width: 40px;
  border-left: 1px solid ${colors.gray300};
`

const StyledCloseIcon = styled(Box)`
  position: absolute;
  top: 10px;
  right: 10px;

  &:hover {
    cursor: pointer;
  }
`

const HoverFlex = styled(Flex)`
  &:hover {
    cursor: pointer;
  }
`

const StyledFlex = styled(Flex)`
  position: relative;
  height: calc(100vh - ${GLOBAL_CTA_HEIGHT / 2}px);
  width: ${CUSTOMER_JOURNEY_AS_SIDEBAR_WIDTH}px;
  min-width: ${CUSTOMER_JOURNEY_AS_SIDEBAR_WIDTH}px;
  border-left: solid 1px ${colors.gray300};
  border-top: solid 1px ${colors.gray300};
  flex-direction: column;
  justify-content: center;
  overflow-x: hidden;
  background-color: white;
`

const LoadingDrawer = () => (
  <StyledLoading>
    <Box style={{ margin: '0 auto' }}>Loading Customer Journey</Box>
    <Box style={{ margin: '8px auto' }}>
      <SyncOutlined spin style={{ color: colors.blue500 }} />
    </Box>
  </StyledLoading>
)

const CustomerDrawer: React.FC<Props> = ({
  customerJourneyRow,
  customerJourneyOptions = {},
  setCustomerJourneyRow,
  queryDefinition,
}) => {
  const { fullJourney = false } = customerJourneyOptions

  const [visible, setVisible] = useState(false)
  const [showSidebarAttributes, setShowSidebarAttributes] = useState(false)

  const toggleShowSidebarAttributes = useCallback(() => {
    setShowSidebarAttributes(!showSidebarAttributes)
  }, [showSidebarAttributes, setShowSidebarAttributes])

  const prevCustomerJourneyRow = usePrevious(customerJourneyRow)
  const [getCustomerJourney, { error, loading, data, infiniteScrollLoading }] = useGetCustomerJourneyFromDataset()

  // Update customer journey data when first or new row clicked
  useEffect(() => {
    if (!isEmpty(customerJourneyRow) && queryDefinition) {
      if (!isEqual(customerJourneyRow, prevCustomerJourneyRow)) {
        getCustomerJourney({ row: customerJourneyRow, dataset: queryDefinition, fullJourney })
      }
    }
  }, [getCustomerJourney, fullJourney, customerJourneyRow, prevCustomerJourneyRow, queryDefinition])

  useEffect(() => {
    if (!isEmpty(data)) {
      setVisible(true)
    }
  }, [setVisible, data])

  const doInfiniteScroll = (e: any) => {
    const {
      target: { offsetHeight, scrollTop, scrollHeight },
    } = e

    const scrollPercent = scrollTop / (scrollHeight + offsetHeight)
    // if you've reached the 70% of the bottom of the sidebar
    if (scrollPercent >= 0.7) {
      // and there is more to scroll to + isn't loading or are errors
      if (
        data &&
        data?.data?.rows?.length % GET_CUSTOMER_JOURNEY_LIMIT === 0 &&
        !loading &&
        !error &&
        queryDefinition
      ) {
        getCustomerJourney({
          row: customerJourneyRow,
          dataset: queryDefinition,
          offset: data?.data?.rows?.length,
          fullJourney,
        })
      }
    }
  }

  // scroll to id from 'go_to_row_id' when receiving a new customer journey response
  useEffect(() => {
    if (data?.go_to_row_id || data?.go_to_row_id === 0) {
      const scrollToId = () => {
        const customerDrawerElement = document.getElementById(ACTIVITY_STREAM_CONTAINER_ID)
        const elementToScrollTo = document.getElementById(`${toString(data?.go_to_row_id)}`)
        if (customerDrawerElement && elementToScrollTo) {
          const scrollToRect = elementToScrollTo.getBoundingClientRect()
          const y = customerDrawerElement.scrollTop + scrollToRect.top - 350
          customerDrawerElement.scrollTo({ top: y, behavior: 'smooth' })
        }
      }
      // add small timeout to make sure the element has rendered
      setTimeout(scrollToId, 300)
    }
  }, [data])

  return (
    <>
      {loading && !infiniteScrollLoading && <LoadingDrawer />}

      {visible && (
        <div data-test="customer-journey-drawer">
          <StyledFlex pt={4}>
            <StyledCloseIcon
              onClick={() => {
                setVisible(false)
                setCustomerJourneyRow(undefined)
              }}
            >
              <CloseOutlined />
            </StyledCloseIcon>

            <Box width="80%" style={{ margin: '0 auto' }}>
              {data?.customer && (
                <Box>
                  <Link
                    to={appendQuery(`/customer_journey/${data?.table}`, {
                      customer: encodeURIComponent(data?.customer),
                      customer_kind: data?.customer_kind,
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Tooltip title={data?.customer}>
                      <div>
                        <Typography type="title300">{truncate(data?.customer, { length: 35 })}</Typography>
                      </div>
                    </Tooltip>
                  </Link>
                </Box>
              )}

              {/* Toggle showing customer attributes */}
              <HoverFlex
                onClick={() => {
                  toggleShowSidebarAttributes()
                }}
                alignItems="center"
                mt={1}
              >
                {/* icon */}
                <Box mr={1}>{showSidebarAttributes ? <DownOutlined /> : <RightOutlined />}</Box>

                <Typography pb={1} type="body50">
                  Attributes
                </Typography>
              </HoverFlex>

              {data?.customer && (
                // use display 'none' so CustomerProfile doesn't re-render and call the api again and again when you toggle the view
                <Box
                  style={{ display: showSidebarAttributes ? 'block' : 'none', overflowY: 'auto', maxHeight: '480px' }}
                >
                  <CustomerProfile customer={data?.customer} sidebarTable={data?.table} />
                </Box>
              )}

              <Typography type="title400" mt={4} pt={3} pb={2} style={{ borderTop: `1px solid ${colors.gray300}` }}>
                Customer Journey
              </Typography>
            </Box>

            {/* Timeline */}
            {data && (
              <div
                style={{ height: '100%', overflowY: 'auto' }}
                onScroll={(e: any) => doInfiniteScroll(e)}
                id={ACTIVITY_STREAM_CONTAINER_ID}
              >
                <ActivityStream
                  customer={data?.customer}
                  error={error?.message}
                  loading={loading}
                  infiniteScrollLoading={infiniteScrollLoading}
                  customerJourneyData={data}
                  isSidebar
                />
              </div>
            )}

            {infiniteScrollLoading && (
              <Flex justifyContent="center" style={{ color: colors.blue500, height: '80px' }}>
                <SyncOutlined spin style={{ fontSize: '24px' }} />
              </Flex>
            )}
          </StyledFlex>
        </div>
      )}
    </>
  )
}

export default CustomerDrawer
