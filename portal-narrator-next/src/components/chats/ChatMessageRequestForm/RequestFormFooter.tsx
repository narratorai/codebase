import { useFormContext } from 'react-hook-form'

interface Props {
  onCancel?: () => void
}

const RequestFormFooter = ({ onCancel }: Props) => {
  const { formState } = useFormContext()
  const { isSubmitting } = formState

  return (
    <div className="justify-end gap-2 border-t border-gray-200 p-5 flex-x-center">
      <button className="button button-xs secondary outlined" disabled={isSubmitting} onClick={onCancel}>
        <span className="button button-xs button-label !px-8">Cancel</span>
      </button>
      <button className="button button-xs primary filled" disabled={isSubmitting} type="submit">
        <span className="button button-xs button-label !px-8">Send</span>
      </button>
    </div>
  )
}

export default RequestFormFooter
