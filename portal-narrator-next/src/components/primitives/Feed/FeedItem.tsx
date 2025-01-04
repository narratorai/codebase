import clsx from 'clsx'

type Props = {
  last?: boolean
} & Omit<React.ComponentPropsWithoutRef<'li'>, 'className'>

const FeedItem = ({ children, last, ...props }: Props) => (
  <li className="relative flex gap-x-4" {...props}>
    <div className={clsx('absolute left-0 top-0 flex w-6 justify-center', last ? 'h-6' : '-bottom-6')}>
      <div className="w-px bg-gray-200" />
    </div>
    {children}
  </li>
)

export default FeedItem
