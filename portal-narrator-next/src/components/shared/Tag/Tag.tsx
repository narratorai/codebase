import clsx from 'clsx'

interface Props extends React.RefAttributes<HTMLDivElement> {
  size: 'sm' | 'md' | 'lg'
  color: 'transparent' | 'white' | 'green' | 'red' | 'purple' | 'yellow' | 'blue' | 'pink' | 'pink-purple' | 'gray'
  border?: boolean
  children: React.ReactNode
}

const Tag = ({ size, color, border, children, ...props }: Props) => (
  <div
    {...props}
    className={clsx('tag flex-wrap whitespace-pre', {
      'tag-border': border,
      'tag-5xs': size === 'sm',
      'tag-4xs': size === 'md',
      'tag-3xs': size === 'lg',
      'tag-transparent': color === 'transparent',
      'tag-white': color === 'white',
      'tag-green': color === 'green',
      'tag-red': color === 'red',
      'tag-purple': color === 'purple',
      'tag-yellow': color === 'yellow',
      'tag-blue': color === 'blue',
      'tag-pink': color === 'pink',
      'tag-pink-purple': color === 'pink-purple',
      'tag-gray': color === 'gray',
    })}
  >
    {children}
  </div>
)

export default Tag
