import React from 'react'

interface Props {
  customerName: string | null
  customerEmail: string
}

const CustomerJourneyTitle = ({ customerName, customerEmail }: Props) => {
  return (
    <div className="!h-fit w-full min-w-60 gap-1 flex-y-center">
      <h2 className="px-2">{customerName || customerEmail}</h2>
      {customerName && <span className="text-md px-2 font-medium text-gray-400">{customerEmail}</span>}
      <div className="w-full border-b border-gray-200 pt-5"></div>
    </div>
  )
}

export default CustomerJourneyTitle
