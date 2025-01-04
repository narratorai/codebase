import CodeEditor from '@/components/shared/CodeEditor'
import SimplePlot from '@/components/shared/SimplePlot'
import Table from '@/components/shared/Table'
import { Indicator, List, Root } from '@/components/shared/Tabs'
import { IRemoteDatasetData } from '@/stores/chats'

import TabContent from './TabContent'
import TabTrigger from './TabTrigger'

interface Props {
  data: IRemoteDatasetData
}

const DatasetData = ({ data }: Props) => {
  const { plotData, sql, tableData } = data

  const defaultTab = plotData ? 'plot' : tableData ? 'table' : 'sql'

  return (
    <Root defaultValue={defaultTab}>
      <List className="flex gap-4">
        <TabTrigger value="plot">Plot</TabTrigger>
        <TabTrigger value="table">Table</TabTrigger>
        <TabTrigger value="sql">SQL</TabTrigger>
      </List>
      <Indicator />
      <TabContent value="plot">{plotData && <SimplePlot height={400} {...plotData} />}</TabContent>
      <TabContent value="table">{tableData && <Table height={444} table={tableData} />}</TabContent>
      <TabContent value="sql">
        <CodeEditor disabled height={444} language="sql" value={sql || ''} />
      </TabContent>
    </Root>
  )
}

export default DatasetData
