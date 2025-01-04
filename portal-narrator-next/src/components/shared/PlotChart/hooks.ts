import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'

import { useCompany } from '@/stores/companies'
import { ChartType, IRemotePlotConfig } from '@/stores/datasets'

import { IRemotePlotConfigs } from './interfaces'
import { getPlotConfig } from './util'

export const usePlotConfig = (plotConfig: IRemotePlotConfig, chartType: ChartType, height?: number) => {
  const localization = useCompany(
    useShallow((state) => ({
      currency: state.currency,
      locale: state.locale,
      timezone: state.timezone,
    }))
  )

  const config = useMemo(
    () => getPlotConfig(plotConfig as IRemotePlotConfigs, chartType, height, localization),
    [localization, height, plotConfig, chartType]
  )

  return config
}
