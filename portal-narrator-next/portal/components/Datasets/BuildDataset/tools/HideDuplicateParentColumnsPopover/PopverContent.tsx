import { Button, Space, Switch } from 'antd-next'
import { Divider } from 'components/antd/staged'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { ColumnSelect } from 'components/Datasets/BuildDataset/tools/shared/ReactHookForm'
import { Box, Flex } from 'components/shared/jawns'
import { filter, includes, isEmpty, map } from 'lodash'
import { useContext } from 'react'
import { useFormContext } from 'react-hook-form'
import styled from 'styled-components'
import { colors } from 'util/constants'

const StyledSwitchContainer = styled(Box)<{ isShowMode: boolean }>`
  .styled-toggle-hide-show {
    background-color: ${({ isShowMode }) => (isShowMode ? colors.green500 : colors.red500)};
  }
`

const HIDDEN_COLUMNS_FIELDNAME = 'hidden_column_ids'
const IS_SHOW_MODE = 'is_show_mode'

interface Props {
  handleClose: () => void
  handleSubmit: () => void
}

const PopverContent = ({ handleClose, handleSubmit }: Props) => {
  const { setValue, watch } = useFormContext()

  const selectedColumns = watch(HIDDEN_COLUMNS_FIELDNAME)
  const onChangeSelectedColumns = (columnsIds: string[]) => setValue(HIDDEN_COLUMNS_FIELDNAME, columnsIds)

  const isShowMode = watch(IS_SHOW_MODE)
  const onChangeIsShowMode = (isShow: boolean) => setValue(IS_SHOW_MODE, !isShow)

  const { machineCurrent } = useContext(DatasetFormContext)
  const allColumns = machineCurrent.context.columns
  const allColumnsIds = map(allColumns, (col) => col.id)

  const handleToggleIsHideMove = (show: boolean) => {
    // maintain form state
    onChangeIsShowMode(!show)

    // if there were columns present
    if (!isEmpty(selectedColumns)) {
      // switch selected columns to all the others
      const oppositeColumns = filter(allColumnsIds, (col) => !includes(selectedColumns, col))
      onChangeSelectedColumns(oppositeColumns)
    }
  }

  return (
    <Box style={{ width: '440px' }} data-test="hide-show-duplicate-parent-columns-container">
      <StyledSwitchContainer isShowMode={isShowMode}>
        <Switch
          data-test="hide-show-duplicate-parent-columns-toggle"
          className="styled-toggle-hide-show"
          checked={isShowMode}
          onChange={handleToggleIsHideMove}
          checkedChildren="Show"
          unCheckedChildren="Hide"
        />
      </StyledSwitchContainer>

      <Box pt={3} pb={2}>
        <ColumnSelect
          labelText={`${isShowMode ? 'Show' : 'Hide'} columns`}
          fieldName={HIDDEN_COLUMNS_FIELDNAME}
          isRequired={false}
          inputProps={{ mode: 'multiple', allowClear: true }}
        />
      </Box>

      <Divider fullPopoverWidth />
      <Flex justifyContent="flex-end">
        <Space>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="primary" onClick={handleSubmit} data-test="hide-show-duplicate-parent-columns-apply-cta">
            Apply
          </Button>
        </Space>
      </Flex>
    </Box>
  )
}

export default PopverContent
