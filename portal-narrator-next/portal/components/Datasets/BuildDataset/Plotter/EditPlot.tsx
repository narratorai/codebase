/* eslint-disable react/jsx-max-depth */

import { BlockOutlined, DeleteOutlined, EditOutlined, PlusOutlined, SyncOutlined } from '@ant-design/icons'
import { Button, Popconfirm, Space, Spin, Tooltip } from 'antd-next'
import { SearchSelect } from 'components/antd/staged'
import MachineError from 'components/Datasets/BuildDataset/tools/shared/MachineError'
import DynamicPlot from 'components/shared/DynamicPlot'
import { Box } from 'components/shared/jawns'
import TrainAIQuestion from 'components/shared/TrainAIQuestion'

import type { Plotter } from './usePlotter'

interface Props extends Omit<Plotter, 'plotOptions'> {
  plotOptions: { label: string; value: string }[]
}

const EditPlot = ({
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
}: Props) => (
  <Box p={2} style={{ height: '100%', overflow: 'auto' }} data-test="dataset-plotter">
    <Box mb={2}>
      <Space>
        <SearchSelect
          style={{ width: 240 }}
          optionFilterProp="label"
          filterOption
          showSearch
          options={plotOptions}
          placeholder="Select Plot"
          popupMatchSelectWidth={false}
          onChange={onChange}
          value={selectedPlotSlug}
        />

        <Tooltip title="Refresh plot">
          <Button onClick={refreshPlot} icon={<SyncOutlined />} />
        </Tooltip>

        <Tooltip title="Edit plot config">
          <Button onClick={editPlot} icon={<EditOutlined />} />
        </Tooltip>

        <Tooltip title="Duplicate plot">
          <Button onClick={duplicatePlot} icon={<BlockOutlined />} />
        </Tooltip>

        <Popconfirm
          placement="topLeft"
          title="Are you sure you want to delete this plot?"
          onConfirm={removePlot}
          okText="Yes"
          cancelText="No"
        >
          <Tooltip trigger="hover" title={plotIsKpiLocked ? 'Cannot delete plots created by Kpis' : undefined}>
            <div>
              <Button
                // this pointerEvents styling is due to Tooltip bug (staying open after leaving hover on disabled buttons)
                // https://github.com/react-component/tooltip/issues/18#issuecomment-411476678
                style={{ pointerEvents: plotIsKpiLocked ? 'none' : 'auto' }}
                danger
                disabled={plotIsKpiLocked}
                icon={<DeleteOutlined />}
              />
            </div>
          </Tooltip>
        </Popconfirm>

        <Button type="primary" onClick={newPlot}>
          <PlusOutlined /> Add New Plot
        </Button>
      </Space>
    </Box>

    <Box>
      <MachineError />
    </Box>

    <Spin spinning={loadingPlotData}>
      {!loadingPlotData && plotData && question && <TrainAIQuestion question={question} />}
      {plotData && <DynamicPlot {...formattedPlotData} copyContentValues={copyContentValues} />}
    </Spin>
  </Box>
)

export default EditPlot
