import { Space, Tabs } from 'antd-next'
import { IMessage } from 'portal/stores/chats'

import Analyze from './Analyze'
import PlotTabContent from './PlotTabContent'
import SQLTabContent from './SQLTabContent'
import TableContent from './TableContent'

interface Props {
  chatId: string
  message: IMessage
  isTableData?: boolean
}

const DatasetTabs = ({ chatId, message, isTableData = false }: Props) => {
  const { data } = message
  const datasetSlug = data?.dataset_slug
  const groupSlug = data?.group_slug
  const plotSlug = data?.plot_slug
  const datasetConfig = { datasetSlug, groupSlug, plotSlug }

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Analyze message={message} />
      <Tabs
        defaultActiveKey={isTableData ? 'table' : 'plot'}
        items={
          isTableData
            ? [
                {
                  key: 'table',
                  label: 'Table',
                  children: <TableContent data={data.table_data} datasetConfig={datasetConfig} />,
                },
                {
                  key: 'sql',
                  label: 'SQL',
                  children: <SQLTabContent query={data.sql} />,
                },
              ]
            : [
                {
                  key: 'plot',
                  label: 'Plot',
                  children: (
                    <PlotTabContent
                      datasetConfig={datasetConfig}
                      data={data.plot_data}
                      message={message}
                      chatId={chatId}
                    />
                  ),
                },
                {
                  key: 'sql',
                  label: 'SQL',
                  children: <SQLTabContent query={data.sql} />,
                },
                {
                  key: 'table',
                  label: 'Table',
                  children: <TableContent data={data.table_data} datasetConfig={datasetConfig} />,
                },
              ]
        }
      />
    </Space>
  )
}

export default DatasetTabs
