import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { map } from 'lodash'
import { makeQueryDefinitionFromContext } from 'machines/datasets'
import { useCallback, useContext, useMemo } from 'react'
import { getGroupFromContext } from 'util/datasets'
import { IDatasetPlotData, IDatasetQueryDefinition, viewTypeConstants } from 'util/datasets/interfaces'
import { makePlotCopiedContent } from 'util/shared_content/helpers'
import { CopiedPlotContent } from 'util/shared_content/interfaces'

export interface FormatedPlotData extends Omit<Partial<IDatasetPlotData>, 'config'> {
  config: {
    dataset_obj: IDatasetQueryDefinition
    plot_slug?: string
    dataset_slug?: string
    group_name?: string
    group_slug?: string
    snapshot_time?: string
    question?: string
  }
}

export interface Plotter {
  selectedPlotSlug?: string
  plotData?: IDatasetPlotData
  question: string | null
  formattedPlotData: FormatedPlotData
  plotIsKpiLocked: boolean
  loadingPlotData: boolean
  copyContentValues?: CopiedPlotContent
  plotOptions: { label: string; value: string }[] | null
  newPlot: () => void
  refreshPlot: () => void
  editPlot: () => void
  removePlot: () => void
  onChange: (plotSlug: string) => void
  duplicatePlot: () => void
  backToTable: () => void
}

const usePlotter = (): Plotter => {
  const { datasetSlug, groupSlug, machineCurrent, machineSend } = useContext(DatasetFormContext)
  const group = getGroupFromContext({ context: machineCurrent.context, groupSlug })

  const selectedPlotSlug = machineCurrent.context._plot_slug
  const plotData = machineCurrent.context._plotter_context?.plot_data
  const queryDefinition = makeQueryDefinitionFromContext(machineCurrent.context)

  const question = plotData?.config?.question || null

  const formattedPlotData = {
    ...plotData,
    config: {
      ...plotData?.config,
      dataset_obj: queryDefinition,
      plot_slug: selectedPlotSlug,
      dataset_slug: datasetSlug,
    },
  }

  const plotIsKpiLocked = !!plotData?.kpi_locked

  const loadingPlotData = machineCurrent.matches({ api: 'loading_plot_data' })

  const newPlot = useCallback(() => {
    machineSend('NEW_PLOT', { groupSlug })
  }, [machineSend, groupSlug])

  const refreshPlot = useCallback(() => {
    machineSend('REFRESH_PLOT', { plotSlug: selectedPlotSlug, groupSlug })
  }, [machineSend, selectedPlotSlug, groupSlug])

  const editPlot = useCallback(() => {
    machineSend('EDIT_PLOT', { plotSlug: selectedPlotSlug, groupSlug })
  }, [machineSend, selectedPlotSlug, groupSlug])

  const removePlot = useCallback(() => {
    if (!plotIsKpiLocked) {
      machineSend('REMOVE_PLOT', { plotSlug: selectedPlotSlug, groupSlug })
    }
  }, [machineSend, selectedPlotSlug, groupSlug, plotIsKpiLocked])

  const onChange = useCallback(
    (plotSlug: string) => {
      machineSend('SELECT_PLOT', { groupSlug, plotSlug })
    },
    [machineSend, groupSlug]
  )

  const duplicatePlot = useCallback(() => {
    if (selectedPlotSlug) {
      machineSend('DUPLICATE_PLOT', { groupSlug, plotSlug: selectedPlotSlug })
    }
  }, [selectedPlotSlug, groupSlug])

  const backToTable = useCallback(() => {
    machineSend('SWITCH_MAIN_VIEW', { view: viewTypeConstants.TABLE })
  }, [machineSend])

  const copyContentValues = useMemo(() => {
    // create copy content values if all fields present
    if (datasetSlug && groupSlug && selectedPlotSlug) {
      return makePlotCopiedContent({ datasetSlug, groupSlug, plotSlug: selectedPlotSlug })
    }

    // otherwise there is nothing to copy
    return undefined
  }, [datasetSlug, groupSlug, selectedPlotSlug])

  const plotOptions = group
    ? map(group.plots, (plot) => ({
        label: plot.name,
        value: plot.slug,
      }))
    : null

  return {
    selectedPlotSlug,
    plotData,
    question,
    formattedPlotData,
    plotIsKpiLocked,
    loadingPlotData,
    copyContentValues,
    plotOptions,
    newPlot,
    refreshPlot,
    editPlot,
    removePlot,
    onChange,
    duplicatePlot,
    backToTable,
  }
}

export default usePlotter
