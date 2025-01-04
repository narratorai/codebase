import { Collapse, Skeleton } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { Link, Typography } from 'components/shared/jawns'
import { find, isEmpty, join, map, startCase } from 'lodash'
import { useEffect } from 'react'
import styled from 'styled-components'
import { useLazyCallMavis } from 'util/useCallMavis'

const TableData = styled.td<{ isFirst: boolean }>`
  ${({ isFirst }) => !isFirst && 'padding-top: 12px;'}
`

const Label = styled.div`
  font-size: 12px;
  white-space: nowrap;
`

const Value = styled.div`
  font-weight: 600;
  font-size: 12px;
  margin-left: 24px;
`

const CollapseWrapper = styled.div`
  .antd5-collapse-header {
    padding: 0 !important;
    padding-top: 24px !important;
  }

  .antd5-collapse-content-box {
    padding: 0 !important;
  }

  .null-value-label {
    padding-top: 12px;
    font-size: 12px;
  }
`

interface Attribute {
  name: string
  value: string
}

type NullAttributes = string[] | null

interface AttributesResponse {
  attributes?: Attribute[]
  null_attributes?: NullAttributes
}

interface Props {
  tableId: string
  customerEmail: string
}

const CustomerAttributes = ({ tableId, customerEmail }: Props) => {
  const company = useCompany()
  const tables = company?.tables || []
  const table = find(tables, ['id', tableId])
  const hasDimension = table?.customer_dim_table_id !== null

  const [getAttributes, { response: attributesResponse, loading: loadingAttributes }] =
    useLazyCallMavis<AttributesResponse>({
      method: 'GET',
      path: `/v2/customer_journey/${tableId}/attributes`,
    })

  useEffect(() => {
    if (hasDimension && customerEmail) {
      getAttributes({ params: { customer: customerEmail } })
    }
  }, [customerEmail, getAttributes, hasDimension])

  const attributes = attributesResponse?.attributes
  const null_attributes = attributesResponse?.null_attributes

  if (loadingAttributes) {
    return <Skeleton active />
  }

  if (!hasDimension) {
    return (
      <Typography type="title400" mb={1}>
        No customer table available. Please create one in{' '}
        <Link unstyled to="/transformations">
          Transformations
        </Link>
      </Typography>
    )
  }

  return <AttributeTableAndNullValues attributes={attributes} null_attributes={null_attributes} />
}

export const AttributeTableAndNullValues = ({ attributes, null_attributes }: AttributesResponse) => {
  return (
    <div>
      <table>
        {map(attributes, (attr, index) => {
          const label = attr.name
          const value = attr.value
          const isFirst = index === 0

          return (
            <tr>
              <TableData isFirst={isFirst} style={{ verticalAlign: 'top' }}>
                <Label>{startCase(label)}</Label>
              </TableData>
              <TableData isFirst={isFirst} style={{ wordBreak: 'break-word' }}>
                <Value>{value}</Value>
              </TableData>
            </tr>
          )
        })}
      </table>

      {!isEmpty(null_attributes) && (
        <CollapseWrapper>
          <Collapse ghost>
            <Collapse.Panel key="1" header="Null Values">
              <div className="null-value-label">{join(null_attributes, ', ')}</div>
            </Collapse.Panel>
          </Collapse>
        </CollapseWrapper>
      )}
    </div>
  )
}

export default CustomerAttributes
