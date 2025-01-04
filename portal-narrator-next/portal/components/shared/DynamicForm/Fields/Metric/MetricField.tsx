import { FieldProps } from '@rjsf/core'
import React from 'react'

import MetricView, { MetricFormat, TimeResolution } from './MetricView'

interface MetricFieldProps extends FieldProps {
  formData: {
    name: string
    value: any
    format: MetricFormat
    lift_percent: number
    last_value: any
    time_resolution: string
  }
}

const MetricField: React.FC<MetricFieldProps> = ({ formData }) => {
  const { name, value, format, lift_percent, last_value, time_resolution } = formData
  return (
    <MetricView
      name={name}
      value={value}
      format={format}
      liftPercent={lift_percent}
      previousValue={last_value}
      timeResolution={time_resolution as TimeResolution}
    />
  )
}

export default MetricField
