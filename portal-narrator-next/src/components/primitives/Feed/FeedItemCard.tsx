type Props = Omit<React.ComponentPropsWithoutRef<'div'>, 'className'>

const FeedItemCard = (props: Props) => (
  <div className="flex-auto rounded-md p-3 ring-1 ring-inset ring-gray-200" {...props} />
)

export default FeedItemCard
