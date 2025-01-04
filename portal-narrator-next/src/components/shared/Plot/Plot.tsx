import MetricsPlot from '@/components/shared/MetricsPlot'
import SimplePlot from '@/components/shared/SimplePlot'
import { IRemoteMetricsPlot, IRemotePlot, IRemoteSimplePlot, PlotType } from '@/stores/datasets'

const Plot = ({ plotType, plot }: IRemotePlot) => (
  <>
    {plotType === PlotType.Simple && <SimplePlot {...(plot as IRemoteSimplePlot)} />}
    {plotType === PlotType.Metrics && <MetricsPlot {...(plot as IRemoteMetricsPlot)} />}
  </>
)

export default Plot
