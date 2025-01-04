import { connectToPreventBackContext } from 'components/PreventBack'
import { useEffect } from 'react'
import { useFormState } from 'react-final-form'

interface Props {
  setShouldPreventBack: (shouldPreventBack: boolean) => void
}

const PreventBackListener = ({ setShouldPreventBack }: Props) => {
  const { dirty } = useFormState({ subscription: { dirty: true } })

  useEffect(() => {
    if (dirty) {
      setShouldPreventBack(true)
    }

    if (!dirty) {
      setShouldPreventBack(false)
    }
  }, [dirty, setShouldPreventBack])

  return null
}

const ConnectedListener = connectToPreventBackContext(PreventBackListener)
export default ConnectedListener
