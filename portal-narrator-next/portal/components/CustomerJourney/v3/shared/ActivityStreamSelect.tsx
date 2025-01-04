import { WarningOutlined } from '@ant-design/icons'
import { Flex, Tooltip } from 'antd-next'
import { SearchSelect } from 'components/antd/staged'
import { useCompany } from 'components/context/company/hooks'
import { find } from 'lodash'
import styled from 'styled-components'
import { colors } from 'util/constants'
import { persistActivityStream } from 'util/persistActivityStream'

const StyledSelect = styled(SearchSelect)`
  .antd5-select-selector {
    border-radius: 100px;
  }
`

interface Props {
  value?: string
  onChange: (value: string) => void
  tableId: string
}

const ActivityStreamSelect = ({ value, onChange, tableId }: Props) => {
  const company = useCompany()

  const selectedTable = find(company.tables, ['id', tableId])
  const hasCustomerDim = !!selectedTable?.customer_dim?.id

  const streamSelectOptions = company?.tables?.map((table) => ({
    value: table.activity_stream,
    label: table.identifier,
  }))

  const handleOnChange = (value: string) => {
    onChange(value)

    persistActivityStream(value)
  }

  return (
    <Flex align="center">
      <StyledSelect
        value={value}
        options={streamSelectOptions}
        onChange={handleOnChange}
        popupMatchSelectWidth={false}
      />

      {!hasCustomerDim && (
        <div style={{ marginLeft: '8px' }}>
          <Tooltip title="There is no customer dimension table, which limits our ability to search. We will filter directly with the search value given.">
            <WarningOutlined style={{ color: colors.yellow500 }} />{' '}
          </Tooltip>
        </div>
      )}
    </Flex>
  )
}

export default ActivityStreamSelect
