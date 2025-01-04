import React from 'react'

import { useCompany } from '@/stores/companies'
import { formatShortDateDistance, formatShortDateDistanceToNow } from '@/util/formatters'

interface Props {
  priorDate: string
  date: string
}

const CustomerJourneyDate = ({ date, priorDate }: Props) => {
  const company = useCompany()
  const shortDateDistanceToNow = formatShortDateDistanceToNow(date, company)
  const shortDateDistance = formatShortDateDistance(date, priorDate, company)
  const shortDateWithDistance = priorDate === date ? shortDateDistanceToNow : shortDateDistance

  return <span className="text-gray-400">{shortDateWithDistance}</span>
}

export default CustomerJourneyDate
