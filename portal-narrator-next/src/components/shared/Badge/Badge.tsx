import clsx from 'clsx'

interface Props extends React.RefAttributes<HTMLDivElement> {
  size: 'sm' | 'md'
  color: 'green' | 'red' | 'purple' | 'yellow' | 'blue' | 'pink' | 'pink-purple' | 'gray'
  appearance?: 'filled' | 'tonal' | 'outlined'
  children: React.ReactNode
}

const Badge = ({ size, color, appearance, children, ...props }: Props) => (
  <div
    {...props}
    className={clsx('badge flex-wrap whitespace-pre', {
      filled: appearance === 'filled',
      tonal: appearance === 'tonal',
      outlined: appearance === 'outlined',
      'badge-sm': size === 'sm',
      'badge-md': size === 'md',
      green: color === 'green',
      red: color === 'red',
      purple: color === 'purple',
      yellow: color === 'yellow',
      blue: color === 'blue',
      pink: color === 'pink',
      'pink-purple': color === 'pink-purple',
      gray: color === 'gray',
    })}
  >
    {children}
  </div>
)

export default Badge
