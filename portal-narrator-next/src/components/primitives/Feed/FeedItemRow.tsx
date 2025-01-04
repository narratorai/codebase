type Props = Omit<React.ComponentPropsWithoutRef<'div'>, 'className'>

const FeedItemRow = (props: Props) => <div className="flex justify-between gap-x-4" {...props} />

export default FeedItemRow
