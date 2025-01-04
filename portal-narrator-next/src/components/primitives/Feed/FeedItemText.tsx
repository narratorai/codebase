type Props = Omit<React.ComponentPropsWithoutRef<'p'>, 'className'>

const FeedItemText = (props: Props) => <p className="text-sm/6 text-gray-500" {...props} />

export default FeedItemText
