import React from 'react'

import { Badge } from '@/components/primitives/Badge'
import { useCompany } from '@/stores/companies'
import { DisplayFormat } from '@/stores/datasets'
import { getFormatter } from '@/util/formatters'

interface Props {
  format?: DisplayFormat | null
  value?: number | null
}

const MetricsPlotTicker = ({ value, format }: Props) => {
  const company = useCompany()

  if (value === null || value === undefined) return null

  const formatter = getFormatter(format, company)
  const formattedValue = formatter(value)
  const color = value < 0 ? 'red' : value > 0 ? 'green' : 'gray'

  return (
    <Badge color={color} pill size="md" soft>
      {formattedValue}
    </Badge>
  )
}

export default MetricsPlotTicker
