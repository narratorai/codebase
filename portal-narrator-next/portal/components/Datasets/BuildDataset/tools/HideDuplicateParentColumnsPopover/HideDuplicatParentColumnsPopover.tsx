import { EyeInvisibleOutlined } from '@ant-design/icons'
import { Button, Popover, Tooltip } from 'antd-next'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { Typography } from 'components/shared/jawns'
import { isEmpty } from 'lodash'
import { useContext, useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { colors } from 'util/constants'
import usePrevious from 'util/usePrevious'

import PopverContent from './PopverContent'

const HIDDEN_COLUMNS_FIELDNAME = 'hidden_column_ids'
const IS_SHOW_MODE = 'is_show_mode'

interface FormProps {
  [HIDDEN_COLUMNS_FIELDNAME]: string[]
  [IS_SHOW_MODE]?: boolean
}

const HideDuplicateParentColumnsPopover = () => {
  const { groupIndex, groupSlug, machineCurrent, machineSend } = useContext(DatasetFormContext) || {}
  const isDuplicateParent = machineCurrent.context._is_parent_duplicate
  const group = machineCurrent.context.all_groups[groupIndex as number]

  const [visible, setVisible] = useState(false)
  const prevVisble = usePrevious(visible)

  const methods = useForm<FormProps>({
    defaultValues: {
      hidden_column_ids: group?.hidden_column_ids || [],
      // backfill - is_show_mode is a new concept
      // if the form doesn't have it - assume it was hidden (original default)
      is_show_mode: !!group?.is_show_mode,
    },
    mode: 'all',
  })

  const { handleSubmit, watch, reset } = methods
  const isShowMode = watch(IS_SHOW_MODE)

  // reset form when becoming visible
  useEffect(() => {
    if (!prevVisble && visible) {
      reset({
        hidden_column_ids: group?.hidden_column_ids || [],
        is_show_mode: !!group?.is_show_mode,
      })
    }
  }, [prevVisble, visible, reset, group])

  const onSubmit = handleSubmit((formValue: FormProps) => {
    machineSend('EDIT_HIDE_DUPLICATE_PARENT_COLUMNS_SUBMIT', {
      groupSlug,
      hiddenColumnIds: formValue.hidden_column_ids,
      isShowMode: formValue.is_show_mode,
    })

    setVisible(false)
  })

  const handleClose = () => {
    machineSend('EDIT_HIDE_DUPLICATE_PARENT_COLUMNS_CANCEL')
    setVisible(false)
  }

  const handleOpen = () => {
    setVisible(true)
    machineSend('EDIT_HIDE_DUPLICATE_PARENT_COLUMNS')
  }

  // make sure we only show this modal on duplicate parents
  if (!isDuplicateParent) {
    return null
  }

  return (
    <Popover
      title={
        <Typography type="title300" py={1}>
          {isShowMode ? 'Show' : 'Hide'} Parent Columns from Duplicate Parent Tab
        </Typography>
      }
      placement="right"
      trigger="click"
      open={visible}
      content={
        <FormProvider {...methods}>
          <form onSubmit={onSubmit}>
            <PopverContent handleClose={handleClose} handleSubmit={onSubmit} />
          </form>
        </FormProvider>
      }
    >
      <div>
        <Tooltip title="Hide or Show parent columns in this tab">
          <Button size="small" onClick={handleOpen} data-test="hide-show-duplicate-parent-columns-button">
            <EyeInvisibleOutlined
              style={{ color: !isEmpty(group?.hidden_column_ids) ? colors.blue500 : colors.gray700 }}
            />
          </Button>
        </Tooltip>
      </div>
    </Popover>
  )
}

export default HideDuplicateParentColumnsPopover
