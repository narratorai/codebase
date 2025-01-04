import { AimOutlined } from '@ant-design/icons'
import { App, Modal, Spin, Tooltip } from 'antd-next'
import { useUser } from 'components/context/user/hooks'
import EditTrainingFormFields from 'components/LLM/Training/EditTrainingFormFields'
import { useFlags } from 'launchdarkly-react-client-sdk'
import { isEmpty } from 'lodash'
import { useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useLazyCallMavis } from 'util/useCallMavis'
import usePrevious from 'util/usePrevious'
import useToggle from 'util/useToggle'

interface FormValue {
  dataset_slug: string
  question: string
  user_questions: { id: string; question: string }[]
}

interface Props {
  dataset_slug?: string
  dataset_obj?: any
  group_slug?: string
  plot_slug?: string
}

const TrainingIconModal = ({ dataset_slug, dataset_obj, group_slug, plot_slug }: Props) => {
  const { notification } = App.useApp()
  const flags = useFlags()
  const { isSuperAdmin } = useUser()
  const allowPlotTraining = flags['plot-llm-training'] && isSuperAdmin
  const [isModalVisible, toggleModal] = useToggle(false)
  const prevIsModalVisible = usePrevious(isModalVisible)

  const methods = useForm<FormValue>({
    mode: 'all',
  })
  const { handleSubmit, reset } = methods

  const [createTrainingQuestion, { response, loading, error }] = useLazyCallMavis<any>({
    method: 'POST',
    path: '/v1/llm/train',
  })
  const prevLoading = usePrevious(loading)
  const createTrainingSuccessfull = prevLoading && !loading && !error && !isEmpty(response)

  const onSubmit = handleSubmit((formData: FormValue) => {
    const { dataset_slug, question, user_questions } = formData
    createTrainingQuestion({
      body: {
        dataset_slug, // dataset_slug comes from prefill response (not initial props)
        question,
        user_questions,
      },
    })
  })

  // get prefill data
  // Only do this once the modal is opened
  const [getPrefillData, { response: prefillData, loading: prefillDataLoading }] = useLazyCallMavis<FormValue>({
    method: 'POST',
    path: '/v1/llm/train/prefill',
  })

  useEffect(() => {
    // get prefill data when the modal is opened
    if (!prevIsModalVisible && isModalVisible) {
      getPrefillData({ body: { dataset_slug, dataset_obj, group_slug, plot_slug } })
    }
  }, [prevIsModalVisible, isModalVisible, getPrefillData, dataset_slug, dataset_obj, group_slug, plot_slug])

  // if prefill data contains question, user_questions, or dataset_slug
  // set them in state for initial values
  useEffect(() => {
    if (prefillData?.question || prefillData?.user_questions) {
      reset(prefillData)
    }
  }, [prefillData, reset])

  // handle success
  useEffect(() => {
    if (createTrainingSuccessfull) {
      notification.success({
        message: 'Training created successfully',
      })

      toggleModal()
    }
  }, [createTrainingSuccessfull, notification, toggleModal])

  const hasDataset = !isEmpty(dataset_obj) || !!dataset_slug
  if (!allowPlotTraining || !hasDataset || !group_slug || !plot_slug) {
    return null
  }

  return (
    <div>
      <Tooltip title="Add Training Questions">
        <AimOutlined onClick={toggleModal} />
      </Tooltip>

      <FormProvider {...methods}>
        <form onSubmit={onSubmit}>
          <Modal
            open={isModalVisible}
            onCancel={toggleModal}
            onOk={onSubmit}
            okButtonProps={{ loading: loading, disabled: loading || prefillDataLoading }}
            okText="Add Training"
            title="Train your data"
            destroyOnClose
          >
            <Spin spinning={prefillDataLoading}>
              <div style={{ paddingBottom: '32px' }}>
                <EditTrainingFormFields showInProductionToggle={false} />
              </div>
            </Spin>
          </Modal>
        </form>
      </FormProvider>
    </div>
  )
}

export default TrainingIconModal
