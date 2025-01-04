import { Flex } from 'antd-next'
import { AttributeTableAndNullValues } from 'components/CustomerJourney/v3/CustomerTimeline/CustomerAttributes'
import { TimelineWrapper } from 'components/CustomerJourney/v3/CustomerTimeline/EventTimeline'
import EventTimelineHeader from 'components/CustomerJourney/v3/CustomerTimeline/EventTimelineHeader'
import EventTimelineItems from 'components/CustomerJourney/v3/CustomerTimeline/EventTimelineItems'
import { filter, head, includes, isEmpty, reverse } from 'lodash'
import { IMessage } from 'portal/stores/chats'
import { useState } from 'react'
import { useToggle } from 'react-use'

import { StyledCard } from '../StyledWrappers'

interface Props {
  message: IMessage
}

const CustomerJourneyData = ({ message }: Props) => {
  const [openedRepeatedEventIds, setOpenedRepeatedEventIds] = useState<string[]>([])
  const [isAsc, toggleIsAsc] = useToggle(false)

  const [events, setEvents] = useState(message.data?.journey?.events || [])
  const firstEvent = head(events) as any

  const handleToggleAsc = () => {
    toggleIsAsc()
    const reversedEvents = reverse(events)
    setEvents(reversedEvents)
  }

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

  const attributes = message.data?.attributes?.attributes || []
  const null_attributes = message.data?.attributes?.null_attributes || []
  const showAttributes = !isEmpty(attributes) || !isEmpty(null_attributes)

  return (
    <Flex style={{ width: '100%' }} gap={16}>
      <StyledCard style={{ width: '100%' }}>
        <TimelineWrapper openedRepeatedEventIds={openedRepeatedEventIds}>
          {!!firstEvent && (
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
        </TimelineWrapper>
      </StyledCard>

      {showAttributes && (
        <StyledCard style={{ height: '100%' }}>
          <AttributeTableAndNullValues attributes={attributes} null_attributes={null_attributes} />
        </StyledCard>
      )}
    </Flex>
  )
}

export default CustomerJourneyData
