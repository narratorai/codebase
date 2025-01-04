import React from 'react'

import { Badge, Label } from '@/components/shared/Badge'
import { useCompany } from '@/stores/companies'
import { formatOrdinal } from '@/util/formatters'

interface Props {
  value: number
}

const CustomerJourneyOccurrence = ({ value }: Props) => {
  const company = useCompany()

  return (
    <Badge color="green" size="md" appearance="tonal">
      <Label>{formatOrdinal(value, company)}</Label>
    </Badge>
  )
}

export default CustomerJourneyOccurrence
