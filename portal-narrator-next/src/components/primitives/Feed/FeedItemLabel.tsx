type Props = Omit<React.ComponentPropsWithoutRef<'p'>, 'className'>

const FeedItemLabel = (props: Props) => <p className="flex-auto py-0.5 text-xs/5 text-gray-500" {...props} />

export default FeedItemLabel
