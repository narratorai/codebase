import ColorButton from '../../BubbleMenu/items/ColorButton'

interface Props {
  color: string
  onClick: () => void
}

export default function CalloutBackgroundButton({ color, onClick }: Props) {
  return <ColorButton color={color} onClick={onClick} />
}
