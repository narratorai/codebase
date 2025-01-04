import React from 'react'

import { Text } from '@/components/primitives/Text'
import { useCompany } from '@/stores/companies'
import { DisplayFormat } from '@/stores/datasets'
import { getFormatter } from '@/util/formatters'

interface Props {
  format?: DisplayFormat
  text?: string | null
  value?: number | string | null
}

const MetricsPlotComparisonValue = ({ format, value, text }: Props) => {
  const company = useCompany()

  if (value === null || value === undefined || value === '') return null

  const formatter = getFormatter(format, company)
  const formattedValue = formatter(value)

  return (
    <>
      <Text color="gray" size="sm" weight="lg">
        {text}
      </Text>
      <Text color="gray" size="sm" weight="lg">
        {formattedValue}
      </Text>
    </>
  )
}

export default MetricsPlotComparisonValue
