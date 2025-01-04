import { useInterval } from 'react-use'

interface Props {
  changeInterval: number
  onChange: () => void
}

export default function AutoSaveReport({ changeInterval, onChange }: Props) {
  useInterval(onChange, changeInterval)
  return null
}
