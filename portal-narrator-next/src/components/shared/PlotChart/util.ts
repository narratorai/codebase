import { DualAxesConfig } from '@ant-design/charts'
import { TooltipItem } from '@antv/g2/lib/interface'
import { produce } from 'immer'
import { each, includes, isEmpty, isFinite, isString, keys, map } from 'lodash'

import { ChartType } from '@/stores/datasets'
import type { IOptions } from '@/util/formatters'
import { getFormatter } from '@/util/formatters'

import { MULTI_Y_AXIS_PLOTS } from './constants'
import { IRemotePlotConfigs } from './interfaces'

const FORMAT_OPTIONS = {
  truncateLimit: 30, // hard coded for now - could make dynamic though
}

const getGeometryOptionsConfig = (config: IRemotePlotConfigs, hasMultiYAxes: boolean, options: IOptions) => {
  const fieldFormatter = (data: Record<string, string | number>, format: string, field: string) => {
    const value = data[field]
    const formatter = getFormatter(format, options)

    const valueIsValid = isFinite(value) || !isEmpty(value)
    if (hasMultiYAxes && format && valueIsValid) {
      return formatter(value)
    }

    return value
  }

  if (hasMultiYAxes && !isEmpty(config?.geometryOptions)) {
    return map(config?.geometryOptions, (option) => {
      const field = option.label?.formatField
      const format = option.label?.narratorFormat

      if (field && format) {
        return {
          ...option,
          label: {
            ...option.label,
            formatter: (data: Record<string, string | number>) => fieldFormatter(data, format, field),
          },
        }
      }

      // if no format or format field return the original option
      return option
    })
  }

  return undefined
}

const getLabelFormatter = (config: IRemotePlotConfigs, options: IOptions) => {
  const format = config?.label?.narratorFormat
  const field = config?.label?.formatField

  const labelFormatter = (data: Record<string, string | number>) => {
    if (field && format) {
      const value = data?.[field]
      const formatter = getFormatter(format, options)

      if (value) {
        const formattedValue = formatter(value)
        // make sure the formattedValue is a number or string before returning
        if (isFinite(formattedValue) || isString(formattedValue)) {
          return formattedValue
        }
      }
    }

    // default show nothing (label format was passed, but was not correctly formatted)
    return null
  }

  if (!format || !field) return config?.label

  return {
    ...config.label,
    formatter: labelFormatter,
  }
}

const getMeta = (config: IRemotePlotConfigs, options: IOptions) => {
  if (isEmpty(config?.meta)) {
    return {}
  }

  return produce(config.meta, (metaDraft) => {
    Object.keys(metaDraft).forEach((key) => {
      const format = metaDraft[key].narratorFormat
      const formatter = getFormatter(format, options)

      if (format) {
        metaDraft[key].formatter = formatter
      }
    })
  })
}

const getSliderConfig = (config: IRemotePlotConfigs, options: IOptions) => {
  if (!config?.slider) return undefined

  const format = config.slider.narratorFormat
  const formatter = getFormatter(format, options)

  return {
    ...(config.slider as object),
    formatter,
  }
}

const getTooltipConfig = (config: IRemotePlotConfigs, options: IOptions) => {
  // for single axis
  const format = config?.tooltip?.narratorFormat

  // for multi axes
  const formats = config?.tooltip?.narratorFormats

  const getTooltipItems = (items: TooltipItem[]) => {
    // single axis
    if (format) {
      return map(items, (item) => {
        const formatter = getFormatter(format, options)
        const formattedValue = formatter(item.value)

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
    if (formats) {
      return map(items, (item, index) => ({
        ...item,
        value: getFormatter(formats[index], options)(item.value),
      }))
    }

    return items
  }

  return {
    ...config?.tooltip,
    customItems: getTooltipItems,
  }
}

const getXAxisConfig = (config: IRemotePlotConfigs, options: IOptions) => {
  const format = config?.xAxis?.label?.narratorFormat
  const formatter = getFormatter(format, options)

  return {
    ...config?.xAxis,
    label: {
      ...config?.xAxis?.label,
      formatter,
    },
  }
}

const getYAxisConfig = (config: IRemotePlotConfigs, hasMultiYAxes: boolean, options: IOptions) => {
  if (hasMultiYAxes) {
    const yAxisKeys = keys(config?.yAxis)
    const axisConfig: DualAxesConfig['yAxis'] = {}

    each(yAxisKeys, (yAxisKey) => {
      const axisConfig = config?.yAxis[yAxisKey]
      const format = axisConfig?.label?.narratorFormat
      const formatter = getFormatter(format, options)

      axisConfig[yAxisKey] = {
        ...axisConfig,
        label: {
          ...axisConfig?.label,
          formatter,
        },
      }
    })

    return axisConfig
  }

  const format = config?.yAxis?.label?.narratorFormat
  const formatter = getFormatter(format, options)

  return {
    ...config?.yAxis,
    label: {
      ...config?.yAxis?.label,
      formatter,
    },
  }
}

export const getPlotConfig = (
  config: IRemotePlotConfigs,
  type: ChartType,
  height: number | undefined,
  options: IOptions
) => {
  const hasMultiYAxes = includes(MULTI_Y_AXIS_PLOTS, type)

  const mergedOptions = { ...options, ...FORMAT_OPTIONS }

  return {
    ...config,
    geometryOptions: getGeometryOptionsConfig(config, hasMultiYAxes, mergedOptions),
    height,
    label: getLabelFormatter(config, mergedOptions),
    meta: getMeta(config, mergedOptions),
    slider: getSliderConfig(config, mergedOptions),
    tooltip: getTooltipConfig(config, mergedOptions),
    xAxis: getXAxisConfig(config, mergedOptions),
    yAxis: getYAxisConfig(config, hasMultiYAxes, mergedOptions),
  }
}
