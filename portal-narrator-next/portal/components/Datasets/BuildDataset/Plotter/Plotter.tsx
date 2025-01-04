import EditPlot from './EditPlot'
import NewPlot from './NewPlot'
import usePlotter from './usePlotter'

const Plotter = () => {
  const plotter = usePlotter()
  const { selectedPlotSlug, plotOptions, newPlot, backToTable } = plotter

  if (!plotOptions) return null
  if (!selectedPlotSlug) return <NewPlot newPlot={newPlot} backToTable={backToTable} />
  return <EditPlot {...plotter} plotOptions={plotOptions} />
}

export default Plotter
