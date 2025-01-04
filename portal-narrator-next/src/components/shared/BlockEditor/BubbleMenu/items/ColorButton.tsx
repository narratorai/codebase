import { RiCircleFill } from 'react-icons/ri'

interface Props {
  color: string
  isSelected?: boolean
  onClick: () => void
}

/**
 * Circle button for selecting a color.
 */
export default function ColorButton({ color, onClick, isSelected = false }: Props) {
  return (
    <button className="relative" onClick={onClick}>
      <span className="block size-6 rounded-full" style={{ backgroundColor: color }} />
      {isSelected ? <RiCircleFill className="text-white absolute-middle" /> : null}
    </button>
  )
}
