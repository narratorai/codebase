import { DeleteOutlined } from '@ant-design/icons'
import { Button, Flex, Select } from 'antd-next'
import { IMapping } from 'portal/stores/settings'

interface MappingProps {
  mapping: IMapping
  sourceOptions: { label: string; value: string }[]
  schemaOptions: { label: string; value: string }[]
  updateMapping: (value: IMapping) => void
  deleteMapping: () => void
}

const Mapping = ({ mapping, sourceOptions, schemaOptions, updateMapping, deleteMapping }: MappingProps) => (
  <Flex gap={8} justify="space-between" style={{ paddingBottom: '16px', borderBottom: 'solid 1px #EEEEEE' }}>
    <Select
      value={mapping.data_source}
      options={sourceOptions}
      style={{ width: '100%' }}
      onChange={(value: string) => updateMapping({ ...mapping, data_source: value })}
      placeholder="Data Source"
    />
    <Select
      value={mapping.schema_name}
      options={schemaOptions}
      style={{ width: '100%' }}
      onChange={(value: string) => updateMapping({ ...mapping, schema_name: value })}
      placeholder="Schema Name"
    />
    <Button type="text" icon={<DeleteOutlined />} style={{ padding: '4px 8px' }} onClick={deleteMapping} />
  </Flex>
)

export default Mapping
