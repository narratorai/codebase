import { Box, Flex, Typography } from 'components/shared/jawns'
import _ from 'lodash'
import styled from 'styled-components'
import { semiBoldWeight } from 'util/constants'
import { COMPUTATION_COLOR_BG } from 'util/datasets'

const TableWrapper = styled(Flex)`
  border: 1px solid ${(props) => props.theme.colors.gray500};
`

const Header = styled(({ type, ...props }) => <Flex {...props} />)`
  height: 28px;
  background-color: ${(props) =>
    props.type === 'dataset' ? props.theme.colors.gray600 : props.theme.colors[COMPUTATION_COLOR_BG]};
`

const ColumnLabel = styled(({ type, ...props }) => <Flex {...props} />)`
  height: 48px;
  border-bottom: 1px solid
    ${(props) => (props.type === 'dataset' ? props.theme.colors.gray600 : props.theme.colors[COMPUTATION_COLOR_BG])};
`

const Cell = styled(({ index, ...props }) => <Flex {...props} />)`
  height: 48px;
  background-color: ${(props) => (props.index % 2 === 0 ? props.theme.colors.gray300 : props.theme.colors.gray400)};
`

type IColumn = {
  type: string
  accessor: string
  header: string
  label: string
}

interface Props {
  columns: IColumn[]
  rows: any[]
}

const ExampleTable = ({ columns, rows }: Props) => {
  if (!rows || rows.length === 0) {
    return null
  }

  return (
    <TableWrapper>
      {_.map(columns, (column, index) => {
        const columnHeader =
          column.type === 'dataset' && index === 0
            ? 'Your Dataset Column'
            : column.type === 'computed'
              ? column.header || 'Your Computed Column'
              : null

        return (
          <Box
            key={column.accessor}
            flexGrow={1}
            style={{
              maxWidth: columns.length > 2 ? '130px !important' : 'initial',
            }}
          >
            <Header alignItems="center" px="8px" type={column.type}>
              {columnHeader && (
                <Typography color="white" type="body300" fontWeight={semiBoldWeight}>
                  {columnHeader}
                </Typography>
              )}
            </Header>

            <ColumnLabel alignItems="center" px="16px" type={column.type}>
              <Typography type="body200" fontWeight={semiBoldWeight}>
                {column.label}
              </Typography>
            </ColumnLabel>

            {_.map(rows, (row, index) => (
              <Cell key={index + row[column.accessor]} alignItems="center" px="16px" index={index}>
                <Typography type="body300" color="blue700">
                  {row[column.accessor]}
                </Typography>
              </Cell>
            ))}
          </Box>
        )
      })}
    </TableWrapper>
  )
}

export default ExampleTable
