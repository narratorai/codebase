import { zodResolver } from '@hookform/resolvers/zod'
import { App, Spin } from 'antd-next'
import { Modal } from 'components/antd/staged'
import { Box, Flex } from 'components/shared/jawns'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import useCallMavis, { useLazyCallMavis } from 'util/useCallMavis'
import { nativeEnum, object, string } from 'zod'

import ApproachSelect from './ApproachSelect'
import AssignedToSelect from './AssignedToSelect'
import AssignTypeSelect from './AssignTypeSelect'
import { ApproachTypes, AssignTypes, IFormData } from './interfaces'

interface Props {
  onClose: () => void
}

const schema = object({
  approach: nativeEnum(ApproachTypes),
  assign_type: nativeEnum(AssignTypes),
  assigned_to: string().array(),
}).required()

const AssignModal = ({ onClose }: Props) => {
  const { notification } = App.useApp()

  const { response: assignResponse, loading: assignLoading } = useCallMavis<IFormData>({
    method: 'GET',
    path: '/v1/llm/request/autoassign',
  })

  const [updateAssign, { response: updateAssignResponse, loading: updateAssignLoading, error: updateAssignError }] =
    useLazyCallMavis<IFormData>({
      method: 'POST',
      path: '/v1/llm/request/autoassign',
    })

  const {
    control,
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<IFormData>({
    defaultValues: { approach: 'least_requests', assign_type: 'all_admins', assigned_to: [] },
    resolver: zodResolver(schema),
  })

  const onSubmit = handleSubmit((data) => {
    // eslint-disable-next-line no-console
    console.log({ data })
    updateAssign({ body: data })
  })

  // handle successful update of assign
  useEffect(() => {
    if (updateAssignResponse && !updateAssignError) {
      notification.success({
        message: 'Assign Rules Updated',
      })

      onClose()
    }
  }, [updateAssignResponse, onClose, updateAssignError, notification])

  // if assignResponse changes, reset the form
  useEffect(() => {
    if (assignResponse) {
      reset(assignResponse)
    }
  }, [assignResponse])

  const assignType = watch('assign_type')

  const handleAssignTypeChange = () => {
    // when type changes, clear assigned to
    setValue('assigned_to', [], { shouldValidate: true })
  }

  const approach = watch('approach')

  return (
    <Modal
      title="Assign Requests"
      open
      okText="Assign"
      onCancel={onClose}
      onOk={onSubmit}
      okButtonProps={{ loading: isSubmitting }}
    >
      <Spin spinning={assignLoading || updateAssignLoading}>
        <Box mb={2} style={{ width: '49%' }}>
          <ApproachSelect control={control} />
        </Box>

        {approach !== ApproachTypes.no_auto_assign && (
          <Flex justifyContent="space-between">
            <Box style={{ width: '49%' }}>
              <AssignTypeSelect control={control} onChange={handleAssignTypeChange} />
            </Box>

            <Box style={{ width: '49%' }}>
              <AssignedToSelect control={control} assignType={assignType} />
            </Box>
          </Flex>
        )}
      </Spin>
    </Modal>
  )
}

export default AssignModal
