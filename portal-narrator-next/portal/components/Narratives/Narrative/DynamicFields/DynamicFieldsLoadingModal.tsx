import { Modal } from 'antd-next'
import ResultProgressLoader from 'components/shared/ResultProgressLoader'

const LOADING_BARS = [
  {
    percent: 20,
    duration: 15,
    text: 'Filters have been applied. The data needs to be extracted from your data warehouse, so it may take a few seconds.',
  },
  {
    percent: 50,
    duration: 30,
    text: 'Your data is still running. All good things are worth the wait!',
  },
  {
    percent: 70,
    duration: 45,
    text: 'Your data is taking a while to process, so Narrator will temporarily store the output for faster results on subsequent runs.',
  },
]

interface Props {
  isOpen: boolean
  onClose: () => void
}

const DynamicFieldsLoadingModal = ({ isOpen, onClose }: Props) => {
  return (
    <Modal onCancel={onClose} open={isOpen} footer={null} destroyOnClose>
      <ResultProgressLoader options={LOADING_BARS} />
    </Modal>
  )
}

export default DynamicFieldsLoadingModal
