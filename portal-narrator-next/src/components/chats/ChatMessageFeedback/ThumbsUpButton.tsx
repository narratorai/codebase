import clsx from 'clsx'
import ThumbsUpIcon from 'static/mavis/icons/thumbs-up.svg'

import Spin from '@/components/shared/Spin'

interface Props {
  disabled: boolean
  loading: boolean
  marked: boolean
  onClick: () => void
}

const ThumbsUpButton = ({ disabled, loading, marked, onClick }: Props) => (
  <button
    className={clsx('button button-xs secondary outlined', { positive: marked })}
    disabled={disabled}
    onClick={onClick}
  >
    {loading && <Spin className="button button-xs button-icon" />}
    {!loading && <ThumbsUpIcon className="button button-xs button-icon" />}
  </button>
)

export default ThumbsUpButton
