import React from 'react'

import { Text } from '@/components/primitives/Text'
import { useCompany } from '@/stores/companies'
import { DisplayFormat } from '@/stores/datasets'
import { getFormatter } from '@/util/formatters'

interface Props {
  format: DisplayFormat
  value: number | string | null
  valueColor: string
}

const MetricsPlotValue = ({ format, value, valueColor }: Props) => {
  const company = useCompany()
  const formatter = getFormatter(format, company)
  const formattedValue = formatter(value)

  return (
    <Text color={valueColor} size="2xl" weight="xl">
      {formattedValue}
    </Text>
  )
}

export default MetricsPlotValue
