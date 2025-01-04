import React from 'react'

import { Label, Tag } from '@/components/shared/Tag'
import { useCompany } from '@/stores/companies'
import { formatCurrency } from '@/util/formatters'

interface Props {
  value: number
}

const CustomerJourneyRevenue = ({ value }: Props) => {
  const company = useCompany()

  return (
    <Tag color="green" size="md" border>
      <Label>{formatCurrency(value, company)}</Label>
    </Tag>
  )
}

export default CustomerJourneyRevenue
