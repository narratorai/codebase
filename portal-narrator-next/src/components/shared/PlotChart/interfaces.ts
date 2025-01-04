import {
  AreaConfig,
  BarConfig,
  ColumnConfig,
  DualAxesConfig,
  LineConfig,
  PieConfig,
  RoseConfig,
  ScatterConfig,
} from '@ant-design/charts'

import { IRemotePlotConfig } from '@/stores/datasets'

export type IRemotePlotConfigs =
  | (IRemotePlotConfig & LineConfig)
  | (ColumnConfig & IRemotePlotConfig)
  | (BarConfig & IRemotePlotConfig)
  | (IRemotePlotConfig & PieConfig)
  | (IRemotePlotConfig & ScatterConfig)
  | (AreaConfig & IRemotePlotConfig)
  | (IRemotePlotConfig & RoseConfig)
  | (DualAxesConfig & IRemotePlotConfig)
