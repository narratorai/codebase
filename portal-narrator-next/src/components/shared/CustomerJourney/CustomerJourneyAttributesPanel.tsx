import React from 'react'

import CustomerJourneyAttributes from '@/components/shared/CustomerJourneyAttributes'
import CustomerJourneyTitle from '@/components/shared/CustomerJourneyTitle'
import { IRemoteJourneyAttributes, IRemoteJourneyCustomer } from '@/stores/journeys'

interface Props {
  attributes: IRemoteJourneyAttributes
  customer: IRemoteJourneyCustomer
}

const CustomerJourneyAttributesPanel = ({ attributes, customer }: Props) => (
  <div className="flex-y-start col-span-1 lg:flex-x">
    <div className="gap-6 p-6 flex-y-center">
      <CustomerJourneyTitle customerEmail={customer.customer} customerName={customer.customerDisplayName} />
      <CustomerJourneyAttributes {...attributes} />
    </div>
    <div className="h-full w-full border-t border-gray-200 lg:w-fit lg:border-l"></div>
  </div>
)

export default CustomerJourneyAttributesPanel
