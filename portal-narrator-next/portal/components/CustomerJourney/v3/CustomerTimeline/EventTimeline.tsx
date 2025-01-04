import { SyncOutlined } from '@ant-design/icons'
import { Empty, Flex, Skeleton } from 'antd-next'
import { filter, head, includes, isEmpty } from 'lodash'
import { useEffect, useRef, useState } from 'react'
import { useToggle } from 'react-use'
import styled from 'styled-components'
import { useDebouncedCallback } from 'use-debounce'
import { breakpoints, colors } from 'util/constants'
import { useLazyCallMavis } from 'util/useCallMavis'
import usePrevious from 'util/usePrevious'

import { REPEATED_ACTIVITY_PARENT_ID_CLASSNAME_PREFIX } from './constants'
import EventTimelineHeader from './EventTimelineHeader'
import EventTimelineItems from './EventTimelineItems'
import { TimelineEvent, TimelineEventsReponse } from './interfaces'

// https://stackoverflow.com/a/68822133/7949930
// also the head/tail/label/content are all shifted to the right by default
// which is why you see the overrides for left/width below
export const TimelineWrapper = styled.div<{ openedRepeatedEventIds: string[] }>`
  height: 100%;
  overflow: hidden auto;
  padding: 16px;

  .antd5-timeline-item-head {
    background-color: transparent !important;
  }

  .antd5-timeline-item-label {
    width: calc(30% - 12px) !important;
  }

  .antd5-timeline-item-content {
    left: calc(31% - 4px) !important;
    width: calc(69% - 4px) !important;
  }

  .antd5-timeline-item-tail,
  .antd5-timeline-item-head {
    left: 31% !important;
  }

  @media only screen and (min-width: ${breakpoints.tablet}) {
    .antd5-timeline-item-label {
      width: calc(20% - 12px) !important;
    }

    .antd5-timeline-item-content {
      left: calc(21% - 4px) !important;
      width: calc(79% - 4px) !important;
    }

    .antd5-timeline-item-tail,
    .antd5-timeline-item-head {
      left: 21% !important;
    }
  }

  @media only screen and (min-width: ${breakpoints.lg}) {
    .antd5-timeline-item-label {
      width: calc(17% - 12px) !important;
    }

    .antd5-timeline-item-content {
      left: calc(18% - 4px) !important;
      width: calc(82% - 4px) !important;
    }

    .antd5-timeline-item-tail,
    .antd5-timeline-item-head {
      left: 18% !important;
    }
  }

  [class*=${REPEATED_ACTIVITY_PARENT_ID_CLASSNAME_PREFIX}] {
    display: none;
  }

  ${({ openedRepeatedEventIds }) => `
    .${REPEATED_ACTIVITY_PARENT_ID_CLASSNAME_PREFIX}${openedRepeatedEventIds.join(
      `, .${REPEATED_ACTIVITY_PARENT_ID_CLASSNAME_PREFIX}`
    )} {
      display: inherit; 
    }
  `}
`

interface Props {
  tableId: string
  customerEmail: string
}

const EventTimeline = ({ tableId, customerEmail }: Props) => {
  const prevCustomerEmail = usePrevious(customerEmail)
  const [openedRepeatedEventIds, setOpenedRepeatedEventIds] = useState<string[]>([])
  const [isAsc, toggleIsAsc] = useToggle(false)

  // handles opening/closing of repeated activities
  const handleRepeatedActivityClick = (repeatedEventId: string) => {
    // check if the activity exists in the list of opened repeated activities
    // (add if it doesn't, remove if it does)
    const shouldAdd = !includes(openedRepeatedEventIds, repeatedEventId)

    if (shouldAdd) {
      return setOpenedRepeatedEventIds([...openedRepeatedEventIds, repeatedEventId])
    }

    if (!shouldAdd) {
      const updatedOpenedRepeatedEventIds = filter(openedRepeatedEventIds, (id) => id !== repeatedEventId)
      setOpenedRepeatedEventIds(updatedOpenedRepeatedEventIds)
    }
  }

  const [getEvents, { response: timelineEventsResponse, loading: timelineEventsLoading }] =
    useLazyCallMavis<TimelineEventsReponse>({
      method: 'GET',
      path: `/v2/customer_journey/${tableId}/events`,
    })

  useEffect(() => {
    if (customerEmail) {
      getEvents({ params: { customer: customerEmail, desc: isAsc ? 'False' : 'True' } })
    }
  }, [getEvents, customerEmail, isAsc])

  const [events, setEvents] = useState<TimelineEvent[]>(timelineEventsResponse?.events || [])
  // if customer changes, reset the events
  useEffect(() => {
    if (prevCustomerEmail !== customerEmail) {
      setEvents([])
    }
  }, [customerEmail, prevCustomerEmail])

  // keep track of all events (including new ones from infinite scroll)
  useEffect(() => {
    if (!isEmpty(timelineEventsResponse?.events)) {
      setEvents((prevEvents) => [...prevEvents, ...(timelineEventsResponse?.events || [])])
    }
  }, [timelineEventsResponse?.events])

  // HANDLE INFINITE SCROLL
  const areMoreEvents = !isEmpty(events) && !timelineEventsResponse?.is_done
  const [isInfiniteLoading, setIsInfiniteLoading] = useState(false)
  const [offset, setOffset] = useState(0)

  const handleToggleAsc = () => {
    // reset the event and offset when toggling asc/desc
    setEvents([])
    setOffset(0)
    toggleIsAsc()
  }

  const timelineRef = useRef<HTMLDivElement | null>(null)
  const timelineElement = timelineRef?.current

  const debouncedInfiniteScrollCallback = useDebouncedCallback(async () => {
    // if you've reached the 70% of the bottom of the page
    // https://css-tricks.com/how-i-put-the-scroll-percentage-in-the-browser-title-bar/
    const scrollTop = timelineElement?.scrollTop || 0
    const elementHeight = timelineElement?.scrollHeight || 0
    const winHeight = window.innerHeight
    const scrollPercent = scrollTop / (elementHeight - winHeight)

    if (scrollPercent >= 0.7 && timelineElement && areMoreEvents && !timelineEventsLoading && !isInfiniteLoading) {
      setIsInfiniteLoading(true)
      await getEvents({ params: { customer: customerEmail, desc: isAsc ? 'False' : 'True', offset: offset + 200 } })
      setIsInfiniteLoading(false)
      setOffset(offset + 200)
    }
  }, 100)

  // Add/Remove infinite scroll listeners
  useEffect(() => {
    // add infinite scroll
    timelineElement?.addEventListener('scroll', debouncedInfiniteScrollCallback)

    return () => {
      // remove infinite scroll on unmount
      timelineElement?.removeEventListener('scroll', debouncedInfiniteScrollCallback)
      debouncedInfiniteScrollCallback.cancel()
    }
  }, [debouncedInfiniteScrollCallback, timelineElement])

  const showInitalLoadingSkeleton = timelineEventsLoading && isEmpty(events)
  const showNoData = !timelineEventsLoading && isEmpty(events)
  const firstEvent = head(events)
  return (
    <TimelineWrapper openedRepeatedEventIds={openedRepeatedEventIds} ref={timelineRef}>
      {showInitalLoadingSkeleton && <Skeleton active />}
      {showNoData && <Empty description="No events found for this customer" />}

      {!showInitalLoadingSkeleton && !showNoData && (
        <div>
          {firstEvent && (
            <EventTimelineHeader firstEventTimestamp={firstEvent.ts} isAsc={isAsc} handleToggleAsc={handleToggleAsc} />
          )}

          {!!events && (
            <EventTimelineItems
              events={events}
              openedRepeatedEventIds={openedRepeatedEventIds}
              handleRepeatedActivityClick={handleRepeatedActivityClick}
              isAsc={isAsc}
            />
          )}

          {isInfiniteLoading && (
            <Flex justify="center" style={{ color: colors.blue500 }}>
              <SyncOutlined spin style={{ fontSize: '24px' }} data-test="lazy-loading-customer-spinner" />
            </Flex>
          )}
        </div>
      )}
    </TimelineWrapper>
  )
}

export default EventTimeline
