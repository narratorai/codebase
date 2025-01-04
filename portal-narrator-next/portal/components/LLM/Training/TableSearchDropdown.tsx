import { SearchOutlined } from '@ant-design/icons'
import { FilterDropdownProps } from 'antd/lib/table/interface'
import { Button, Input, Space } from 'antd-next'
import type { InputRef } from 'antd-next/es/input'

interface TableSearchDropdownProps
  extends Pick<FilterDropdownProps, 'selectedKeys' | 'setSelectedKeys' | 'clearFilters' | 'confirm'> {
  ref: React.RefObject<InputRef>
  placeholder: string
}

const TableSearchDropdown = ({
  ref,
  selectedKeys,
  setSelectedKeys,
  clearFilters,
  confirm,
  placeholder,
}: TableSearchDropdownProps) => {
  return (
    <div style={{ padding: 8 }}>
      <Input
        ref={ref}
        placeholder={placeholder}
        value={selectedKeys[0]}
        onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
        onPressEnter={(e) => {
          e.stopPropagation()
          confirm()
        }}
        style={{ marginBottom: 8, display: 'block' }}
      />
      <Space>
        <Button type="primary" onClick={() => confirm()} icon={<SearchOutlined />} size="small" style={{ width: 90 }}>
          Search
        </Button>
        <Button
          onClick={() => {
            clearFilters?.()
            confirm()
          }}
          size="small"
          style={{ width: 90 }}
        >
          Reset
        </Button>
      </Space>
    </div>
  )
}

export default TableSearchDropdown
