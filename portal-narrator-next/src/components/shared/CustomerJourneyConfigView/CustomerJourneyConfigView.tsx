import React from 'react'

import { Content, Line } from '@/components/shared/TagContent'
import { IRemoteJourneyConfig } from '@/stores/journeys'

import { useCustomerJourneyConfig } from './hooks'

interface Props {
  config: IRemoteJourneyConfig
}

const CustomerJourneyConfigView = ({ config }: Props) => {
  const { customerLine, activitiesLine, dateRangeLine } = useCustomerJourneyConfig(config)

  return (
    <Content>
      <Line tokens={customerLine} />
      <Line tokens={activitiesLine} />
      <Line tokens={dateRangeLine} />
    </Content>
  )
}

export default CustomerJourneyConfigView
