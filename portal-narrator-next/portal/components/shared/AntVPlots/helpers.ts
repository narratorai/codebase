import { DualAxesConfig } from '@ant-design/charts'
import ValueFormatter from 'components/shared/DataTable/ValueFormatter'
import { ICompany } from 'graph/generated'
import { produce } from 'immer'
import { each, includes, isEmpty, isFinite, isString, keys, map } from 'lodash'
import { TooltipItem } from 'node_modules/@antv/g2/lib/interface'

import { MULTI_Y_AXIS_PLOTS } from './constants'
import { AntVPlotConfigs, AntVPlotTypes } from './interfaces'

// Do not format large numbers in tooltip
const FORMAT_OPTIONS = {
  formatLargeNumbers: true,
  truncateLimit: 30, // hard coded for now - could make dynamic though
}

function getXAxisConfig(valueFormatter: ValueFormatter, timezone: string, config?: AntVPlotConfigs) {
  const xAxisFormatter = (value: string | number) => {
    const format = config?.xAxis?.label?.narrator_format

    if (format) return valueFormatter.formatValue(format, value, timezone, FORMAT_OPTIONS)
    return value
  }

  return {
    ...config?.xAxis,
    label: {
      ...config?.xAxis?.label,
      formatter: xAxisFormatter,
    },
  }
}

function getYAxisConfig(
  valueFormatter: ValueFormatter,
  timezone: string,
  hasMultiYAxes: boolean,
  config?: AntVPlotConfigs
) {
  const yAxisFormatter = (value: string | number) => {
    const format = config?.yAxis?.label?.narrator_format

    if (format) return valueFormatter.formatValue(format, value, timezone, FORMAT_OPTIONS)
    return value
  }

  const yMultiAxesFormatter = (value: string | number, format: string) => {
    if (format) return valueFormatter.formatValue(format, value, timezone, FORMAT_OPTIONS)
    return value
  }

  if (hasMultiYAxes) {
    const yAxisKeys = keys(config?.yAxis)
    const axisConfig: DualAxesConfig['yAxis'] = {}

    each(yAxisKeys, (yAxisKey) => {
      const axisConfig = config?.yAxis[yAxisKey]
      const format = axisConfig?.label?.narrator_format

      axisConfig[yAxisKey] = {
        ...axisConfig,
        label: {
          ...axisConfig?.label,
          formatter: (value: string | number) => yMultiAxesFormatter(value, format),
        },
      }
    })

    return axisConfig
  }

  return {
    ...config?.yAxis,
    label: {
      ...config?.yAxis?.label,
      formatter: yAxisFormatter,
    },
  }
}

function getLabelFormatter(valueFormatter: ValueFormatter, timezone: string, config?: AntVPlotConfigs) {
  const labelFormat = config?.label?.narrator_format
  const labelFormatField = config?.label?.format_field

  const labelFormatter = (data: Record<string, string | number>) => {
    if (labelFormatField && labelFormat) {
      const shownValue = data?.[labelFormatField]

      if (shownValue) {
        const formattedValue = valueFormatter.formatValue(labelFormat, shownValue, timezone, FORMAT_OPTIONS)
        // make sure the formattedValue is a number or string before returning
        if (isFinite(formattedValue) || isString(formattedValue)) {
          return formattedValue
        }
      }
    }

    // default show nothing (label format was passed, but was not correctly formatted)
    return null
  }

  if (!labelFormat || !labelFormatField) return config?.label

  return {
    ...config.label,
    formatter: labelFormatter,
  }
}

function getSliderConfig(valueFormatter: ValueFormatter, timezone: string, config?: AntVPlotConfigs) {
  const sliderFormat = config?.slider?.narrator_format
  const sliderFormatter = (value: string | number) => {
    if (sliderFormat) {
      return valueFormatter.formatValue(sliderFormat, value, timezone, FORMAT_OPTIONS)
    }

    return value
  }

  if (!config?.slider) return undefined

  return {
    ...(config.slider as object),
    formatter: sliderFormatter,
  }
}

function getTooltipConfig(
  valueFormatter: ValueFormatter,
  timezone: string,
  config?: AntVPlotConfigs,
  getTooltipData?: (data: any) => void
) {
  // for single axis
  const tooltipFormat = config?.tooltip?.narrator_format

  // for multi axes
  const tooltipsFormats = config?.tooltip?.narrator_formats

  const getTooltipItems = (items: TooltipItem[]) => {
    getTooltipData?.(items[0]?.data)

    // single axis
    if (tooltipFormat) {
      return map(items, (item) => {
        const formattedValue = valueFormatter.formatValue(tooltipFormat, item.value, timezone)

        return {
          ...item,
          data: {
            ...item.data,
            // only tiny-area seems to need this, but it will not show the
            // updated value unless the data is formatted as well
            [item.name]: formattedValue,
          },
          value: formattedValue,
        }
      })
    }

    // multi axes
    if (tooltipsFormats) {
      return map(items, (item, index) => ({
        ...item,
        value: valueFormatter.formatValue(tooltipsFormats[index], item.value, timezone),
      }))
    }

    return items
  }

  return {
    ...config?.tooltip,
    customItems: getTooltipItems,
  }
}

function getMeta(valueFormatter: ValueFormatter, timezone: string, config?: AntVPlotConfigs) {
  if (isEmpty(config?.meta)) {
    return {}
  }

  return produce(config.meta, (metaDraft) => {
    Object.keys(metaDraft).forEach((key) => {
      const format = metaDraft[key].narrator_format

      if (format) {
        metaDraft[key].formatter = (value: string | number) =>
          valueFormatter.formatValue(format, value, timezone, FORMAT_OPTIONS)
      }
    })
  })
}

function getGeometryOptionsConfig(
  valueFormatter: ValueFormatter,
  timezone: string,
  hasMultiYAxes: boolean,
  config?: AntVPlotConfigs
) {
  const formatter = (data: Record<string, string | number>, format: string, field: string) => {
    const value = data[field]

    const valueIsValid = isFinite(value) || !isEmpty(value)
    if (hasMultiYAxes && format && valueIsValid) {
      return valueFormatter.formatValue(format, value, timezone, FORMAT_OPTIONS)
    }

    return value
  }

  if (hasMultiYAxes && !isEmpty(config?.geometryOptions)) {
    return map(config?.geometryOptions, (option) => {
      const field = option.label?.format_field
      const format = option.label?.narrator_format

      if (field && format) {
        return {
          ...option,
          label: {
            ...option.label,
            formatter: (data: Record<string, string | number>) => formatter(data, format, field),
          },
        }
      }

      // if no format or format field return the original option
      return option
    })
  }

  return undefined
}

export function getPlotConfig(
  company: ICompany,
  timezone: string,
  height: number | undefined,
  config?: AntVPlotConfigs,
  type?: AntVPlotTypes,
  getTooltipData?: (data: any) => void
) {
  const valueFormatter = new ValueFormatter(undefined, company.currency_used || 'USD')
  const hasMultiYAxes = includes(MULTI_Y_AXIS_PLOTS, type)

  return {
    ...config,
    meta: getMeta(valueFormatter, timezone, config),
    xAxis: getXAxisConfig(valueFormatter, timezone, config),
    yAxis: getYAxisConfig(valueFormatter, timezone, hasMultiYAxes, config),
    label: getLabelFormatter(valueFormatter, timezone, config),
    slider: getSliderConfig(valueFormatter, timezone, config),
    tooltip: getTooltipConfig(valueFormatter, timezone, config, getTooltipData),
    geometryOptions: getGeometryOptionsConfig(valueFormatter, timezone, hasMultiYAxes, config),
    height,
  }
}
