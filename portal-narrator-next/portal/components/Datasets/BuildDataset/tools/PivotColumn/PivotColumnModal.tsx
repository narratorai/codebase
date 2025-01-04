import { Modal } from 'antd-next'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { Box, Typography } from 'components/shared/jawns'
import { get, take } from 'lodash'
import { makeMetricsOnPivotedToggle } from 'machines/datasets/helpers'
import { useContext, useEffect, useState } from 'react'
import usePrevious from 'util/usePrevious'

import { MAX_PIVOTS_ALLOWED } from './constants'
import DistinctValues from './DistinctValues'

const PivotColumnModal = () => {
  const [orderedPivotedMetrics, setOrderedPivotedMetrics] = useState([])

  const { groupIndex, groupSlug, machineCurrent, machineSend } = useContext(DatasetFormContext)
  const { all_groups: allGroups, _edit_context: editContext } = machineCurrent.context

  const visible = machineCurrent.matches({ edit: 'column_pivot' })
  const prevVisible = usePrevious(visible)

  // @ts-ignore pivotColumnResponse does not exist on type
  const pivotValues = editContext?.pivotColumnResponse?.values || []
  const showablePivots: string[] = take(pivotValues, MAX_PIVOTS_ALLOWED)

  const columnDefinition = get(editContext, 'event.column', {})
  const columnId = columnDefinition.id

  const applyingPivot = !columnDefinition.pivoted

  const cancelAndClose = () => {
    machineSend('EDIT_COLUMN_PIVOT_CANCEL')
  }

  const onApply = () => {
    // Update State Machine
    if (applyingPivot) {
      machineSend('EDIT_COLUMN_PIVOT_SUBMIT', {
        columnId,
        groupSlug,
        pivotValues: showablePivots,
        orderedPivotedMetrics,
      })
    } else {
      machineSend('EDIT_COLUMN_PIVOT_REVERSE_SUBMIT', { groupSlug, columnId })
    }
  }

  useEffect(() => {
    // set initial orderedPivotedMetrics when modal becomes visible
    if (!prevVisible && visible) {
      const { pivotedMetrics } = makeMetricsOnPivotedToggle({
        // @ts-ignore groupIndex might be null
        group: allGroups[groupIndex],
        columnId,
        pivotValues: showablePivots,
      })

      // @ts-ignore setOrderedPivotedMetrics has to be typed
      setOrderedPivotedMetrics(pivotedMetrics)
    }
  }, [prevVisible, visible, allGroups, groupIndex, columnId, showablePivots])

  return (
    <Modal
      title={<Typography type="title400">Pivot Column - {columnDefinition.label}</Typography>}
      open={visible}
      onCancel={cancelAndClose}
      onOk={onApply}
      okText={applyingPivot ? 'Apply' : 'Reverse Pivot'}
    >
      <Box>
        <Box mb={2}>
          {applyingPivot && (
            <>
              <Typography type="body100" mb="8px">
                We'll create pivot columns based on unique values for column <b>{columnDefinition.label}</b>.
              </Typography>
              <Typography type="body100">Re-run dataset to refresh unique values.</Typography>
            </>
          )}

          {!applyingPivot && (
            <Typography type="body100">
              Would you like to remove pivot on column <b>{columnDefinition.label}</b>?
            </Typography>
          )}
        </Box>

        <Box>
          {applyingPivot && (
            <Box>
              <DistinctValues
                pivotedMetrics={orderedPivotedMetrics}
                setOrderedPivotedMetrics={setOrderedPivotedMetrics}
                pivotValues={pivotValues}
              />
            </Box>
          )}
        </Box>
      </Box>
    </Modal>
  )
}

export default PivotColumnModal
