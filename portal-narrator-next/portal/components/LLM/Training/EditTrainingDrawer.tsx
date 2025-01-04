import { App, Button, Drawer, Spin } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import DeleteTrainingIcon from 'components/LLM/Training/DeleteTrainingIcon'
import EditTrainingFormFields from 'components/LLM/Training/EditTrainingFormFields'
import { TrainingType } from 'components/LLM/Training/interfaces'
import TrainingPlot from 'components/LLM/Training/TrainingPlot'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { useGetTrainingQuery } from 'graph/generated'
import { forEach, map } from 'lodash'
import { useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { zIndex } from 'util/constants'
import { useLazyCallMavis } from 'util/useCallMavis'

interface FormValue {
  question: string
  in_production: boolean
  user_questions: { id: string; question: string }[]
}

interface Props {
  id: string
  onClose: () => void
  onSuccess?: () => void
}

const makeTrainingFormValues = (training?: TrainingType): FormValue => {
  return {
    question: training?.question || '',
    in_production: training?.in_production || false,
    user_questions: map(training?.user_training_questions, (userQuestion) => ({
      // maintain ids in form values for unique keys
      // (helps when deleting user questions)
      id: userQuestion.id,
      question: userQuestion.question,
    })),
  }
}

const EditTraingingDrawer = ({ id, onClose, onSuccess }: Props) => {
  const { notification } = App.useApp()
  const company = useCompany()

  const {
    data: trainingData,
    loading: trainingLoading,
    error: getTrainingError,
  } = useGetTrainingQuery({
    variables: { id, company_id: company.id },
  })

  const training = trainingData?.llm_training?.[0]

  const methods = useForm<FormValue>({
    // defaultValues: makeTrainingFormValues(training),
    mode: 'all',
  })

  const { handleSubmit, reset } = methods

  // reset form state when training data is available
  // (we don't have default values when drawer opens)
  useEffect(() => {
    if (training) {
      reset(makeTrainingFormValues(training))
    }
  }, [training, reset])

  const [editTrainging, { response: editTrainingData, loading: editTrainingLoading, error: editTrainingError }] =
    useLazyCallMavis<any>({
      method: 'PATCH',
      path: `/v1/llm/train/${id}`,
      errorNotificationProps: {
        placement: 'topLeft',
      },
    })

  const onSubmit = handleSubmit((formData: FormValue) => {
    // only return a flat array of questions string[]
    const formattedUserQuestions: string[] = []
    forEach(formData.user_questions, (userQuestion) => {
      // only add if the question is not empty
      if (userQuestion.question) {
        formattedUserQuestions.push(userQuestion.question)
      }
    })

    const formattedData = {
      ...formData,
      user_questions: formattedUserQuestions,
    }
    editTrainging({ body: formattedData })
  })

  // handle successful edit
  useEffect(() => {
    if (editTrainingData && !editTrainingError) {
      notification.success({
        message: 'Training updated successfully',
        placement: 'topLeft',
      })

      onSuccess?.()
    }
  }, [editTrainingData, editTrainingError, notification, onSuccess])

  // handle get training error
  useEffect(() => {
    if (getTrainingError) {
      notification.error({
        message: 'Error fetching training',
        description: getTrainingError.message,
        duration: null,
        placement: 'topLeft',
      })
    }
  }, [getTrainingError, notification])

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit}>
        <Drawer
          placement="right"
          open
          width={800}
          onClose={onClose}
          // keeps drawer above helpscout beancon icon
          // and below the notification banner
          zIndex={zIndex.notification - 1}
          title={
            <Flex justifyContent="space-between">
              <Typography type="title400">Edit Training</Typography>

              <DeleteTrainingIcon id={id} onClose={onClose} />
            </Flex>
          }
          footer={
            <Flex justifyContent="flex-end">
              <Box mr={2}>
                <Button onClick={onClose}>Cancel</Button>
              </Box>

              <Button type="primary" onClick={onSubmit} disabled={editTrainingLoading} loading={editTrainingLoading}>
                Update
              </Button>
            </Flex>
          }
        >
          <Spin spinning={trainingLoading}>
            {!!training && <EditTrainingFormFields />}
            {!!training && <TrainingPlot id={training.id} />}
          </Spin>
        </Drawer>
      </form>
    </FormProvider>
  )
}

export default EditTraingingDrawer
