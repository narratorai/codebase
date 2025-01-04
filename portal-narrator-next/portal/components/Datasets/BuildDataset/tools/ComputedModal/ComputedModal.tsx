import { Modal } from 'antd-next'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { Box, Flex, Typography } from 'components/shared/jawns'
import _ from 'lodash'
import { useContext, useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import styled from 'styled-components'
import { colors, semiBoldWeight } from 'util/constants'
import { DEFAULT_COMPUTED_COLUMN } from 'util/datasets'
import { IDatasetQueryGroupComputedColumn } from 'util/datasets/interfaces'
import usePrevious from 'util/usePrevious'

import ComputedColumnForm from './ComputedColumnForm'
import { COMPUTED_KINDS_BY_CATEGORY, KIND_FREEHAND_FUNCTION, NO_CATEGORY } from './computedConstants'
import FunctionContext, { HeaderLabel } from './FunctionContext'
import { ComputedColumnKind } from './interfaces'

const ComputedLabel = styled(Typography)`
  cursor: pointer;

  &:hover {
    color: ${colors.orange500};
  }
`

const ComputedModal = () => {
  const { groupSlug, machineCurrent, machineSend } = useContext(DatasetFormContext) || {}
  const [hoverKind, setHoverKind] = useState<string>()
  const [activeKind, setActiveKind] = useState<string>()
  const prevActiveKind = usePrevious(activeKind)
  const [shouldFocusLabel, setShouldFocusLabel] = useState<boolean>()

  // (edit mode only) Grab the column that you're editing to use as initialValues:
  const { _edit_context: editContext } = machineCurrent.context
  const column = _.get(editContext, 'event.column')

  const isEdit = !!column
  let kindOverride = _.get(column, 'source_details.kind')

  // set override to "freehand_function" if column is "append" and has source_kind "computed"
  const isAppendComputedColumn =
    column?.source_kind === 'computed' && column?.source_details?.activity_kind === 'append'
  if (isAppendComputedColumn) {
    kindOverride = KIND_FREEHAND_FUNCTION.kind
  }

  const visible = machineCurrent.matches({ edit: 'computation' })

  const methods = useForm<IDatasetQueryGroupComputedColumn>({
    defaultValues: isEdit ? column : DEFAULT_COMPUTED_COLUMN,
    mode: 'all',
  })

  const { handleSubmit, reset, setFocus } = methods

  useEffect(() => {
    if (!hoverKind && kindOverride) {
      setHoverKind(kindOverride)
    }
    if (!activeKind && kindOverride) {
      setActiveKind(kindOverride)
    }
  }, [activeKind, hoverKind, kindOverride])

  // when switching from one kind of computed column to another (i.e. Time Add -> Freehand Function)
  useEffect(() => {
    if (prevActiveKind && activeKind && !_.isEqual(prevActiveKind, activeKind)) {
      // reset the form with default values (keeping "label" and "id" if they existed)
      reset({
        ...DEFAULT_COMPUTED_COLUMN,
        label: column?.label || '',
        id: column?.id || null,
      })

      // set should focus to avoid race condition (force re-render)
      setShouldFocusLabel(true)
    }
  }, [prevActiveKind, activeKind, reset, column])

  // when changing the selected kind (i.e. Time Add -> Freehand Function)
  useEffect(() => {
    if (shouldFocusLabel) {
      // if they change the type - they should probably change the label
      // focus and select the label to suggest they update it
      setFocus('label', { shouldSelect: true })
      setShouldFocusLabel(false)
    }
  }, [shouldFocusLabel, setFocus])

  const cancelAndClose = () => {
    machineSend('EDIT_COMPUTATION_CANCEL')
  }

  const onSubmit = handleSubmit((formValue: IDatasetQueryGroupComputedColumn) => {
    machineSend('EDIT_COMPUTATION_SUBMIT', { column: formValue, isEdit, groupSlug })
  })

  if (!visible) {
    return null
  }

  return (
    <Modal
      data-test="edit-computed-column-modal"
      footer={null}
      open={visible}
      title={<Typography type="title400">Computed Columns</Typography>}
      onCancel={cancelAndClose}
      // Matches RelationshipAnimationModal:
      width="85%"
      style={{ top: 50, maxWidth: 1240 }}
    >
      <Flex>
        {/* Sidebar with compute column options */}
        <Box width="200px" style={{ minWidth: 200 }} data-public>
          {_.map(COMPUTED_KINDS_BY_CATEGORY, (kindGroup) => (
            <Box key={kindGroup.label} mb={4}>
              {kindGroup.label !== NO_CATEGORY && <HeaderLabel>{kindGroup.label}</HeaderLabel>}

              {_.map(kindGroup.kinds as ComputedColumnKind[], (kindObj) => {
                const active = activeKind === kindObj.kind
                return (
                  <Flex key={kindObj.kind}>
                    <ComputedLabel
                      data-test="edit-computed-column-label"
                      color={active ? 'orange500' : 'blue900'}
                      fontWeight={active ? semiBoldWeight : 'normal'}
                      onClick={() => setActiveKind(kindObj.kind)}
                      onMouseEnter={() => setHoverKind(kindObj.kind)}
                      onMouseLeave={() => setHoverKind(undefined)}
                      pb="4px"
                    >
                      {kindObj.label}
                    </ComputedLabel>
                  </Flex>
                )
              })}
            </Box>
          ))}
        </Box>

        {/* Middle bar that shows description and example data/functions */}
        <Box py={3} mx={4} bg="gray200" width="360px" style={{ minWidth: 360 }} data-public>
          <FunctionContext activeKind={hoverKind || activeKind} />
        </Box>

        {/* Right side with form for creating/editing compute column */}
        {activeKind && (
          <Box px={2} flexGrow={1} key={activeKind}>
            <FormProvider {...methods}>
              <form onSubmit={onSubmit}>
                <ComputedColumnForm isEdit={isEdit} handleSubmit={onSubmit} kind={activeKind} />
              </form>
            </FormProvider>
          </Box>
        )}
      </Flex>
    </Modal>
  )
}

export default ComputedModal
