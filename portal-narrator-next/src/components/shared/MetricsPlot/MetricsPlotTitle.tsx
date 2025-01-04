import React from 'react'

import { Text } from '@/components/primitives/Text'

interface Props {
  subtitle?: string | null
  title: string
}

const MetricsPlotTitle = ({ title, subtitle }: Props) => (
  <>
    <Text color="gray" size="lg" weight="xl">
      {title}
    </Text>
    {subtitle && (
      <Text color="gray" size="sm" weight="lg">
        {subtitle}
      </Text>
    )}
  </>
)

export default MetricsPlotTitle
