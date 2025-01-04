type Props = Omit<React.ComponentPropsWithoutRef<'span'>, 'className'>

const FeedItemTitle = (props: Props) => <span className="font-medium text-gray-900" {...props} />

export default FeedItemTitle
