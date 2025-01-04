import { Button } from '@/components/primitives/Button'

interface Props {
  onClick: (favorite: boolean) => void
}

export default function FilterButtonGroup({ onClick }: Props) {
  return (
    <div className="space-x-2 flex-x-center">
      <Button onClick={() => onClick(false)} pill>
        All
      </Button>
      <Button onClick={() => onClick(true)} pill>
        Favorite
      </Button>
    </div>
  )
}
